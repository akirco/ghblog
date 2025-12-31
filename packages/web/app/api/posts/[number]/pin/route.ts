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

    const client = getGitHubClient();
    const issue = await client.pinIssue(issueNumber);

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Error pinning issue:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to pin issue",
      },
      { status: 500 }
    );
  }
}