import { AuthWrapper } from "@/components/auth-wrapper";
import { Editor } from "@/components/editor";
import { Button } from "@/components/ui/button";
import { getGitHubClient } from "@/lib/github";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EditPostPageProps {
  params: Promise<{ number: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { number } = await params;
  const issueNumber = Number.parseInt(number, 10);

  if (isNaN(issueNumber)) {
    notFound();
  }

  let issue = null;

  try {
    const client = getGitHubClient();
    issue = await client.getIssue(issueNumber);
  } catch (e) {
    console.error("Error fetching issue for edit:", e);
    notFound();
  }

  if (!issue) {
    notFound();
  }

  const initialLabels = issue.labels?.map((label) => label.name) || [];

  return (
    <AuthWrapper>
      <div className="bg-background min-h-screen">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
          <div className="mb-8">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/posts/${issueNumber}`}>
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Post
              </Link>
            </Button>
          </div>

          <Editor
            mode="edit"
            initialTitle={issue.title}
            initialContent={issue.body || ""}
            initialLabels={initialLabels}
            issueNumber={issueNumber}
          />
        </div>
      </div>
    </AuthWrapper>
  );
}
