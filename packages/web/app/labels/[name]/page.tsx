import { getGitHubClient, type Issue } from "@/lib/github";
import Link from "next/link";

interface LabelPageProps {
  params: Promise<{ name: string }>;
}

export default async function LabelPage({ params }: LabelPageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  let issues: Issue[] = [];
  let error = null;

  try {
    const client = getGitHubClient();
    issues = await client.getIssuesByLabel(decodedName);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load posts";
  }

  // Filter out pinned label from display
  const filteredIssues = issues.filter(issue =>
    issue.labels?.some(label => label.name === decodedName)
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
          </div>
        </div>
      </header>

      <main className="mx-auto px-6 py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-bold text-3xl tracking-tight mb-2">
            Label: <span className="text-primary">{decodedName}</span>
          </h1>
          <p className="text-muted-foreground">
            {filteredIssues.length} post{filteredIssues.length !== 1 ? 's' : ''} with this label
          </p>
        </div>

        {error ? (
          <div className="bg-destructive/5 p-6 border border-destructive/20 rounded-lg">
            <p className="font-medium text-destructive">{error}</p>
            <p className="mt-2 text-muted-foreground text-sm">
              Failed to load posts for label &quot;{decodedName}&quot;.
            </p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="flex flex-col justify-center items-center min-h-100 text-center">
            <p className="mb-2 font-medium text-foreground text-lg">
              No posts with label &quot;{decodedName}&quot;
            </p>
            <p className="mb-6 text-muted-foreground text-sm">
              This label exists but no posts are using it.
            </p>
            <Link
              href="/"
              className="text-sm text-primary hover:underline"
            >
              ← Back to all posts
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredIssues.map((issue) => {
              const bodyText = issue.body || "";
              const excerpt = bodyText
                .replace(/<[^>]*>/g, "")
                .substring(0, 200);

              return (
                <article key={issue.number} className="group">
                  <Link href={`/posts/${issue.number}`} className="block">
                    <h2 className="group-hover:opacity-60 mb-3 font-bold text-foreground text-2xl tracking-tight transition-opacity">
                      {issue.title}
                    </h2>
                    <p className="mb-4 text-muted-foreground text-base line-clamp-3 leading-relaxed">
                      {excerpt || "No content"}
                    </p>
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
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}