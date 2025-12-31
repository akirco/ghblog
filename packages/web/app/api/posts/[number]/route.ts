import { getGitHubClient, GITHUB_ISSUE_MAX_LENGTH } from "@/lib/github";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params;
    const issueNumber = Number.parseInt(number, 10);

    if (isNaN(issueNumber)) {
      return NextResponse.json(
        { error: "Invalid issue number" },
        { status: 400 }
      );
    }

    const client = getGitHubClient();
    const issue = await client.getIssue(issueNumber);

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch post",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params;
    const issueNumber = Number.parseInt(number, 10);

    if (isNaN(issueNumber)) {
      return NextResponse.json(
        { error: "Invalid issue number" },
        { status: 400 }
      );
    }

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
    const issue = await client.updateIssue(issueNumber, title, body, labels);

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update post",
      },
      { status: 500 }
    );
  }
}
