import { getGitHubClient, GITHUB_ISSUE_MAX_LENGTH } from "@/lib/github";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { title, body, labels } = await request.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    if (body.length > GITHUB_ISSUE_MAX_LENGTH) {
      return NextResponse.json(
        {
          error: `Content is too long. Maximum allowed is ${GITHUB_ISSUE_MAX_LENGTH.toLocaleString()} characters, but received ${body.length.toLocaleString()} characters.`,
        },
        { status: 400 }
      );
    }

    const client = getGitHubClient();
    const issue = await client.createIssue(title, body, labels);

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create post",
      },
      { status: 500 }
    );
  }
}
