import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getGitHubClient, type Issue } from "@/lib/github";
import { PenSquare } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  let issues: Issue[] = [];
  let error = null;

  try {
    const client = getGitHubClient();
    const response = await client.listIssues("open");
    issues = response.data;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load posts";
  }

  // Sort issues: pinned first, then by creation date (newest first)
  const pinnedIssues = issues.filter((issue) =>
    issue.labels?.some((label) => label.name === "pinned")
  );
  const unpinnedIssues = issues.filter(
    (issue) => !issue.labels?.some((label) => label.name === "pinned")
  );

  // Sort pinned issues by creation date (newest first)
  pinnedIssues.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  // Sort unpinned issues by creation date (newest first)
  unpinnedIssues.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border border-b">
        <div className="mx-auto px-6 py-6 max-w-3xl">
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="hover:opacity-70 font-bold text-foreground text-2xl tracking-tight transition-opacity"
            >
              Blog
            </Link>
            <Button asChild variant="ghost" size="sm">
              <Link href="/new">
                <PenSquare className="mr-2 w-4 h-4" />
                Write
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto px-6 py-12 max-w-3xl">
        {error ? (
          <div className="bg-destructive/5 p-6 border border-destructive/20 rounded-lg">
            <p className="font-medium text-destructive">{error}</p>
            <p className="mt-2 text-muted-foreground text-sm">
              Please check your GITHUB_OWNER, GITHUB_REPO and GITHUB_TOKEN
              environment variables.
            </p>
          </div>
        ) : issues.length === 0 ? (
          <div className="flex flex-col justify-center items-center min-h-100 text-center">
            <p className="mb-2 font-medium text-foreground text-lg">
              No posts yet
            </p>
            <p className="mb-6 text-muted-foreground text-sm">
              Start writing your first post
            </p>
            <Button asChild variant="outline">
              <Link href="/new">
                <PenSquare className="mr-2 w-4 h-4" />
                Create Post
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Pinned posts grid */}
            {pinnedIssues.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex justify-center items-center bg-yellow-100 dark:bg-yellow-900 rounded-full w-8 h-8">
                    <span className="text-yellow-800 dark:text-yellow-200 text-sm">
                      📌
                    </span>
                  </div>
                  <h2 className="font-bold text-2xl tracking-tight">
                    Pinned Posts
                  </h2>
                </div>
                <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                  {pinnedIssues.map((issue) => {
                    const bodyText = issue.body || "";
                    const excerpt = bodyText
                      .replace(/<[^>]*>/g, "")
                      .substring(0, 200);

                    return (
                      <article
                        key={issue.number}
                        className="group bg-card shadow-sm hover:shadow-md p-6 border border-yellow-300 hover:border-border/80 dark:border-yellow-700 rounded-lg transition-all"
                      >
                        <Link href={`/posts/${issue.number}`} className="block">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1 min-w-0">
                              <h2 className="group-hover:opacity-60 mb-2 font-bold text-xl truncate tracking-tight transition-opacity">
                                {issue.title}
                              </h2>
                              <p className="mb-3 text-muted-foreground text-sm wrap-break-word line-clamp-3 leading-relaxed">
                                {excerpt || "No content"}
                              </p>
                            </div>
                          </div>
                        </Link>
                        {issue.labels &&
                          issue.labels.filter(
                            (label) => label.name !== "pinned"
                          ).length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {issue.labels
                                .filter((label) => label.name !== "pinned")
                                .map((label) => (
                                  <Badge
                                    key={label.id}
                                    variant="outline"
                                    asChild
                                    className="inline-flex items-center gap-1 hover:opacity-80 px-2 py-1 transition-colors"
                                    style={{
                                      backgroundColor: `#${label.color}20`,
                                      borderColor: `#${label.color}`,
                                      color: `#${label.color}`,
                                    }}
                                  >
                                    <Link
                                      href={`/labels/${label.name}`}
                                      className="inline-flex items-center gap-1"
                                    >
                                      <div
                                        className="rounded-full w-2 h-2"
                                        style={{
                                          backgroundColor: `#${label.color}`,
                                        }}
                                      />
                                      {label.name}
                                    </Link>
                                  </Badge>
                                ))}
                            </div>
                          )}
                        <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-xs">
                          <time dateTime={issue.created_at}>
                            {new Date(issue.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </time>
                          {issue.comments > 0 && (
                            <span>
                              {issue.comments}{" "}
                              {issue.comments === 1 ? "comment" : "comments"}
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Unpinned posts list */}
            {unpinnedIssues.length > 0 && (
              <div className={pinnedIssues.length > 0 ? "pt-8 border-t" : ""}>
                {pinnedIssues.length > 0 && (
                  <h2 className="mb-6 font-bold text-2xl tracking-tight">
                    All Posts
                  </h2>
                )}
                <div className="space-y-12">
                  {unpinnedIssues.map((issue) => {
                    const bodyText = issue.body || "";
                    const excerpt = bodyText
                      .replace(/<[^>]*>/g, "")
                      .substring(0, 200);

                    return (
                      <article key={issue.number} className="group">
                        <Link href={`/posts/${issue.number}`} className="block">
                          <h2 className="group-hover:opacity-60 mb-3 font-bold text-foreground text-2xl truncate tracking-tight transition-opacity">
                            {issue.title}
                          </h2>
                          <p className="mb-4 text-muted-foreground text-base wrap-break-word line-clamp-3 leading-relaxed">
                            {excerpt || "No content"}
                          </p>
                        </Link>
                        {issue.labels &&
                          issue.labels.filter(
                            (label) => label.name !== "pinned"
                          ).length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {issue.labels
                                .filter((label) => label.name !== "pinned")
                                .map((label) => (
                                  <Badge
                                    key={label.id}
                                    variant="outline"
                                    asChild
                                    className="inline-flex items-center gap-1 hover:opacity-80 px-2 py-1 transition-colors"
                                    style={{
                                      backgroundColor: `#${label.color}20`,
                                      borderColor: `#${label.color}`,
                                      color: `#${label.color}`,
                                    }}
                                  >
                                    <Link
                                      href={`/labels/${label.name}`}
                                      className="inline-flex items-center gap-1"
                                    >
                                      <div
                                        className="rounded-full w-2 h-2"
                                        style={{
                                          backgroundColor: `#${label.color}`,
                                        }}
                                      />
                                      {label.name}
                                    </Link>
                                  </Badge>
                                ))}
                            </div>
                          )}
                        <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                          <time dateTime={issue.created_at}>
                            {new Date(issue.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </time>
                          {issue.comments > 0 && (
                            <span>
                              {issue.comments}{" "}
                              {issue.comments === 1 ? "comment" : "comments"}
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
