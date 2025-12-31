import { auth } from "@/lib/auth";
import { getGitHubClient } from "@/lib/github";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
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
    const response = await client.listComments(issueNumber);

    return NextResponse.json({ comments: response.data });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
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

    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - Please login with GitHub" },
        { status: 401 }
      );
    }

    const { body } = await request.json();

    if (!body || typeof body !== "string" || !body.trim()) {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 }
      );
    }

    const client = getGitHubClient(session.accessToken as string);
    const comment = await client.createComment(issueNumber, body);

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
