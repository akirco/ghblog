import { CodeHighlighter } from "@/components/code-highlighter";
import { CommentsSection } from "@/components/comments-section";
import { PostActions } from "@/components/post-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getGitHubClient } from "@/lib/github";
import { ArrowLeft, Calendar, Edit, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PostPageProps {
  params: Promise<{ number: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { number } = await params;
  const issueNumber = Number.parseInt(number, 10);

  if (isNaN(issueNumber)) {
    notFound();
  }

  let issue = null;
  let error = null;

  try {
    const client = getGitHubClient();
    issue = await client.getIssue(issueNumber);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load post";
  }

  if (!issue && !error) {
    notFound();
  }

  const content = issue?.body || "";
  const isPinned = issue?.labels?.some((label) => label.name === "pinned") ?? false;
  const isClosed = issue?.state === "closed";

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Home
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/posts/${issueNumber}/edit`}>
                <Edit className="mr-2 w-4 h-4" />
                Edit
              </Link>
            </Button>
            {issue && (
              <>
                <PostActions
                  issueNumber={issueNumber}
                  isPinned={isPinned}
                  isClosed={isClosed}
                />
                <Button asChild variant="outline" size="sm">
                  <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 w-4 h-4" />
                    GitHub
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>

        {error ? (
          <Card className="p-8 text-center">
            <p className="text-destructive">{error}</p>
          </Card>
        ) : issue ? (
          <>
            <article>
              <header className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="font-bold text-4xl sm:text-5xl text-balance tracking-tight">
                    {issue.title}
                  </h1>
                  {issue.state === "closed" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm font-medium">
                      Closed
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <time dateTime={issue.created_at}>
                      {new Date(issue.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  {issue.user && (
                    <div className="flex items-center gap-2">
                      <span>By</span>
                      <a
                        href={`https://github.com/${issue.user.login}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {issue.user.login}
                      </a>
                    </div>
                  )}
                </div>
              </header>

              {/* Labels */}
              {issue.labels && issue.labels.filter(label => label.name !== 'pinned').length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {issue.labels
                    .filter(label => label.name !== 'pinned')
                    .map(label => (
                      <Badge
                        key={label.id}
                        variant="outline"
                        asChild
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: `#${label.color}20`,
                          borderColor: `#${label.color}`,
                          color: `#${label.color}`,
                        }}
                      >
                        <a href={`/labels/${label.name}`}>
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: `#${label.color}` }}
                          />
                          {label.name}
                        </a>
                      </Badge>
                    ))}
                </div>
              )}

              <CodeHighlighter html={content} />

              {issue.updated_at !== issue.created_at && (
                <footer className="mt-12 pt-6 border-t text-muted-foreground text-sm">
                  Last updated on{" "}
                  {new Date(issue.updated_at).toLocaleDateString("US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </footer>
              )}
            </article>

            <CommentsSection issueNumber={issueNumber} />
          </>
        ) : null}
      </div>
    </div>
  );
}
