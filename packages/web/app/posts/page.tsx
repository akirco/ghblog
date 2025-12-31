import { Button } from "@/components/ui/button";
import { getGitHubClient, type Issue } from "@/lib/github";
import { ArrowLeft, PenSquare } from "lucide-react";
import Link from "next/link";

export default async function PostsPage() {
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
  pinnedIssues.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  // Sort unpinned issues by creation date (newest first)
  unpinnedIssues.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border border-b">
        <div className="mx-auto px-6 py-6 max-w-3xl">
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="hover:opacity-70 font-bold text-foreground text-2xl tracking-tight transition-opacity"
            >
              Home
            </Link>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/">
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/new">
                  <PenSquare className="mr-2 w-4 h-4" />
                  Write
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-6 py-12 max-w-3xl">
        <div className="mb-12">
          <h1 className="mb-2 font-bold text-4xl tracking-tight">Posts</h1>
          <p className="text-muted-foreground">
            {issues.length} {issues.length === 1 ? "post" : "posts"} total
            {pinnedIssues.length > 0 && ` • ${pinnedIssues.length} pinned`}
          </p>
        </div>

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
                  <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                    <span className="text-yellow-800 dark:text-yellow-200 text-sm">📌</span>
                  </div>
                  <h2 className="font-bold text-2xl tracking-tight">Pinned Posts</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pinnedIssues.map((issue) => {
                    const bodyText = issue.body || "";
                    const excerpt = bodyText
                      .replace(/<[^>]*>/g, "")
                      .substring(0, 200);

                    return (
                      <article
                        key={issue.number}
                        className="group bg-card border border-yellow-300 dark:border-yellow-700 rounded-lg shadow-sm p-6 transition-all hover:shadow-md hover:border-border/80"
                      >
                        <Link href={`/posts/${issue.number}`} className="block">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h2 className="group-hover:opacity-60 mb-2 font-bold text-xl tracking-tight transition-opacity">
                                {issue.title}
                              </h2>
                              <p className="line-clamp-3 leading-relaxed text-sm text-muted-foreground mb-3">
                                {excerpt || "No content"}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <time dateTime={issue.created_at}>
                              {new Date(issue.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
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
              </div>
            )}

            {/* Unpinned posts list */}
            {unpinnedIssues.length > 0 && (
              <div className={pinnedIssues.length > 0 ? 'pt-8 border-t' : ''}>
                {pinnedIssues.length > 0 && (
                  <h2 className="mb-6 font-bold text-2xl tracking-tight">All Posts</h2>
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
                          <h2 className="group-hover:opacity-60 mb-3 font-bold text-foreground text-2xl tracking-tight transition-opacity">
                            {issue.title}
                          </h2>
                          <p className="mb-4 text-muted-foreground text-base line-clamp-3 leading-relaxed">
                            {excerpt || "No content"}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                            <time dateTime={issue.created_at}>
                              {new Date(issue.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
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
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
