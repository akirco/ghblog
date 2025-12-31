import { getGitHubClient } from "@/lib/github";
import { NextResponse } from "next/server";

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

    const { state } = await request.json();

    if (state !== "open" && state !== "closed") {
      return NextResponse.json(
        { error: "State must be 'open' or 'closed'" },
        { status: 400 }
      );
    }

    const client = getGitHubClient();
    const issue = state === "closed"
      ? await client.closeIssue(issueNumber)
      : await client.reopenIssue(issueNumber);

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Error updating issue state:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update issue state",
      },
      { status: 500 }
    );
  }
}