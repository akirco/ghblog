import { getGitHubClient } from "@/lib/github";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const client = getGitHubClient();
    const labels = await client.listLabels();
    return NextResponse.json(labels);
  } catch (error) {
    console.error("Error fetching labels:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch labels",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, color, description } = await request.json();

    if (!name || !color) {
      return NextResponse.json(
        { error: "Name and color are required" },
        { status: 400 }
      );
    }

    // Prevent creation of the special "pinned" label
    if (name.toLowerCase() === "pinned") {
      return NextResponse.json(
        { error: "Label name 'pinned' is reserved for system use" },
        { status: 400 }
      );
    }

    const client = getGitHubClient();
    const label = await client.createLabel(name, color, description);

    return NextResponse.json(label);
  } catch (error) {
    console.error("Error creating label:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create label",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { error: "Label name is required" },
        { status: 400 }
      );
    }

    // Prevent deletion of the special "pinned" label
    if (name === "pinned") {
      return NextResponse.json(
        { error: "Cannot delete the 'pinned' label" },
        { status: 400 }
      );
    }

    const client = getGitHubClient();

    // Check if label is used by any issues
    const issuesWithLabel = await client.getIssuesByLabel(name);

    if (issuesWithLabel.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete label "${name}" because it is used by ${issuesWithLabel.length} post(s)`,
          issues: issuesWithLabel.map(issue => ({
            number: issue.number,
            title: issue.title,
            url: issue.html_url
          }))
        },
        { status: 400 }
      );
    }

    // Delete the label
    await client.deleteLabel(name);

    return NextResponse.json({
      success: true,
      message: `Label "${name}" deleted successfully`
    });
  } catch (error) {
    console.error("Error deleting label:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete label",
      },
      { status: 500 }
    );
  }
}