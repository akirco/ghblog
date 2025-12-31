// GitHub Issues API client
export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
}

export interface Issue {
  number: number;
  title: string;
  body: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  comments: number;
  state: "open" | "closed";
  locked: boolean;
  labels?: Label[];
  user: {
    login: string;
    avatar_url: string;
  } | null;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  description: string | null;
  default: boolean;
}

export interface Comment {
  id: number;
  body: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  } | null;
}

export interface UploadImageResponse {
  url: string;
  path: string;
  sha: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  perPage: number;
  totalPages?: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const GITHUB_ISSUE_MAX_LENGTH = 65536;

export class GitHubClient {
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  private get headers() {
    return {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${this.config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }

  private get baseUrl() {
    return `https://api.github.com/repos/${this.config.owner}/${this.config.repo}`;
  }

  async verifyPermissions(): Promise<{ canWrite: boolean; message?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        headers: this.headers,
      });

      if (!response.ok) {
        return {
          canWrite: false,
          message: `Cannot access repository: ${response.statusText}`,
        };
      }

      const repo = await response.json();
      return {
        canWrite: repo.permissions?.push === true,
        message: repo.permissions?.push
          ? undefined
          : "Token lacks 'contents: write' permission. Please update your GitHub Token with proper permissions.",
      };
    } catch (error) {
      return {
        canWrite: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to verify permissions",
      };
    }
  }

  async uploadImage(
    imagePath: string,
    content: string,
    message = "Upload image"
  ): Promise<UploadImageResponse> {
    const response = await fetch(`${this.baseUrl}/contents/${imagePath}`, {
      method: "PUT",
      headers: this.headers,
      body: JSON.stringify({
        message,
        content, // Base64 encoded content
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();

      if (response.status === 403) {
        throw new Error(
          `Permission denied: Your GitHub token needs 'contents: write' permission to upload images. ` +
            `Please create a new token at https://github.com/settings/tokens with 'repo' or 'contents: write' scope.`
        );
      }

      throw new Error(
        `Failed to upload image: ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();

    // 返回 GitHub raw URL
    const rawUrl = `https://raw.githubusercontent.com/${this.config.owner}/${this.config.repo}/refs/heads/${process.env.GITHUB_REPO_BRANCH}/${imagePath}`;

    return {
      url: rawUrl,
      path: imagePath,
      sha: data.content.sha,
    };
  }

  async listIssues(
    state: "open" | "closed" | "all" = "all",
    page = 1,
    perPage = 10
  ): Promise<PaginatedResponse<Issue>> {
    const response = await fetch(
      `${this.baseUrl}/issues?state=${state}&sort=created&direction=desc&page=${page}&per_page=${perPage}`,
      {
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list issues: ${response.statusText}`);
    }

    const data = await response.json();

    // Parse Link header for pagination info
    const linkHeader = response.headers.get("link");
    const hasNext = linkHeader?.includes('rel="next"') ?? false;
    const hasPrev = linkHeader?.includes('rel="prev"') ?? false;

    return {
      data,
      page,
      perPage,
      hasNext,
      hasPrev,
    };
  }

  // Get a single issue (blog post)
  async getIssue(issueNumber: number): Promise<Issue> {
    const response = await fetch(`${this.baseUrl}/issues/${issueNumber}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get issue: ${response.statusText}`);
    }

    return response.json();
  }

  // Create a new issue (blog post)
  async createIssue(
    title: string,
    body: string,
    labels?: string[]
  ): Promise<Issue> {
    if (body.length > GITHUB_ISSUE_MAX_LENGTH) {
      throw new Error(
        `Content is too long. Maximum allowed is ${GITHUB_ISSUE_MAX_LENGTH} characters, but got ${body.length} characters.`
      );
    }

    const response = await fetch(`${this.baseUrl}/issues`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ title, body, labels }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create issue: ${response.statusText}`);
    }

    return response.json();
  }

  // Update an existing issue (blog post)
  async updateIssue(
    issueNumber: number,
    title: string,
    body: string,
    labels?: string[]
  ): Promise<Issue> {
    if (body.length > GITHUB_ISSUE_MAX_LENGTH) {
      throw new Error(
        `Content is too long. Maximum allowed is ${GITHUB_ISSUE_MAX_LENGTH} characters, but got ${body.length} characters.`
      );
    }

    const response = await fetch(`${this.baseUrl}/issues/${issueNumber}`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify({ title, body, labels }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update issue: ${response.statusText}`);
    }

    return response.json();
  }

  // Update issue fields partially (state, labels, etc.)
  async updateIssuePartial(
    issueNumber: number,
    updates: {
      title?: string;
      body?: string;
      state?: "open" | "closed";
      labels?: string[];
    }
  ): Promise<Issue> {
    const response = await fetch(`${this.baseUrl}/issues/${issueNumber}`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update issue: ${response.statusText}`);
    }

    return response.json();
  }

  // Close an issue
  async closeIssue(issueNumber: number): Promise<Issue> {
    return this.updateIssuePartial(issueNumber, { state: "closed" });
  }

  // Reopen an issue
  async reopenIssue(issueNumber: number): Promise<Issue> {
    return this.updateIssuePartial(issueNumber, { state: "open" });
  }

  // Pin an issue (add "pinned" label)
  async pinIssue(issueNumber: number): Promise<Issue> {
    // First get current labels
    const issue = await this.getIssue(issueNumber);
    const currentLabels = issue.labels?.map((label) => label.name) || [];

    // Add "pinned" label if not already present
    if (!currentLabels.includes("pinned")) {
      const newLabels = [...currentLabels, "pinned"];
      return this.updateIssuePartial(issueNumber, { labels: newLabels });
    }

    return issue;
  }

  // Unpin an issue (remove "pinned" label)
  async unpinIssue(issueNumber: number): Promise<Issue> {
    // First get current labels
    const issue = await this.getIssue(issueNumber);
    const currentLabels = issue.labels?.map((label) => label.name) || [];

    // Remove "pinned" label if present
    if (currentLabels.includes("pinned")) {
      const newLabels = currentLabels.filter((label) => label !== "pinned");
      return this.updateIssuePartial(issueNumber, { labels: newLabels });
    }

    return issue;
  }

  // Get all labels for the repository
  async listLabels(): Promise<Label[]> {
    const response = await fetch(`${this.baseUrl}/labels`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to list labels: ${response.statusText}`);
    }

    return response.json();
  }

  // Create a new label
  async createLabel(
    name: string,
    color: string,
    description?: string
  ): Promise<Label> {
    const response = await fetch(`${this.baseUrl}/labels`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        name,
        color: color.replace("#", ""), // Remove # if present
        description: description || "",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create label: ${response.statusText}`);
    }

    return response.json();
  }

  // Delete a label
  async deleteLabel(name: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/labels/${encodeURIComponent(name)}`,
      {
        method: "DELETE",
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete label: ${response.statusText}`);
    }
  }

  // Get issues by label (to check if label is used)
  async getIssuesByLabel(
    labelName: string,
    state: "open" | "closed" | "all" = "all"
  ): Promise<Issue[]> {
    const response = await fetch(
      `${this.baseUrl}/issues?labels=${encodeURIComponent(
        labelName
      )}&state=${state}&sort=created&direction=desc`,
      {
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get issues by label: ${response.statusText}`);
    }

    return response.json();
  }

  async listComments(
    issueNumber: number,
    page = 1,
    perPage = 30
  ): Promise<PaginatedResponse<Comment>> {
    const response = await fetch(
      `${this.baseUrl}/issues/${issueNumber}/comments?page=${page}&per_page=${perPage}&sort=created&direction=asc`,
      {
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list comments: ${response.statusText}`);
    }

    const data = await response.json();

    // Parse Link header for pagination info
    const linkHeader = response.headers.get("link");
    const hasNext = linkHeader?.includes('rel="next"') ?? false;
    const hasPrev = linkHeader?.includes('rel="prev"') ?? false;

    return {
      data,
      page,
      perPage,
      hasNext,
      hasPrev,
    };
  }

  async createComment(issueNumber: number, body: string): Promise<Comment> {
    const response = await fetch(
      `${this.baseUrl}/issues/${issueNumber}/comments`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ body }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create comment: ${response.statusText}`);
    }

    return response.json();
  }
}

// Helper function to get GitHub client
export function getGitHubClient(customToken?: string): GitHubClient {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = customToken || process.env.GITHUB_TOKEN;

  if (!owner || !repo || !token) {
    throw new Error(
      "GitHub configuration is missing. Please set GITHUB_OWNER, GITHUB_REPO, and GITHUB_TOKEN environment variables."
    );
  }

  return new GitHubClient({ owner, repo, token });
}
