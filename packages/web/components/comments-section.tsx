"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Comment } from "@/lib/github";
import { LogIn, LogOut, MessageSquare, Send } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";

interface CommentsSectionProps {
  issueNumber: number;
}

export function CommentsSection({ issueNumber }: CommentsSectionProps) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/posts/${issueNumber}/comments`);
      if (!response.ok) throw new Error("Failed to load comments");
      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [issueNumber]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/posts/${issueNumber}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: newComment }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to post comment");
      }

      const data = await response.json();
      setComments([...comments, data.comment]);
      setNewComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-16 pt-8 border-t">
      <h2 className="flex items-center gap-2 mb-8 font-semibold">
        <MessageSquare className="w-6 h-6" />
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      {/* Comment Form */}
      <Card className="shadow-none mb-8 p-6">
        {status === "authenticated" ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                {session.user?.image && (
                  <Avatar className="w-8 h-8">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={session.user.image || "/placeholder.svg"}
                      alt={session.user.name || ""}
                      className="rounded-full"
                    />
                  </Avatar>
                )}
                <span className="font-medium text-sm">
                  {session.user?.name}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="mr-2 w-4 h-4" />
                Log out
              </Button>
            </div>

            <form onSubmit={handleSubmit}>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write your comment..."
                className="mb-4 min-h-25"
                disabled={submitting}
              />

              {error && (
                <p className="mb-4 text-destructive text-sm">{error}</p>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                >
                  <Send className="mr-2 w-4 h-4" />
                  {submitting ? "Sending..." : "Post Comment"}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="mb-4 text-muted-foreground">
              Sign in with GitHub to post comments
            </p>
            <Button onClick={() => signIn("github")}>
              <LogIn className="mr-2 w-4 h-4" />
              Sign in with GitHub
            </Button>
          </div>
        )}
      </Card>

      {/* Comments List */}
      {loading ? (
        <div className="py-8 text-muted-foreground text-center">
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-muted-foreground text-center">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className="shadow-none p-6">
              <div className="flex items-start gap-3 mb-4">
                {comment.user?.avatar_url && (
                  <Avatar className="w-10 h-10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={comment.user.avatar_url || "/placeholder.svg"}
                      alt={comment.user.login}
                      className="rounded-full"
                    />
                  </Avatar>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {comment.user && (
                      <a
                        href={`https://github.com/${comment.user.login}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline"
                      >
                        {comment.user.login}
                      </a>
                    )}
                    <span className="text-muted-foreground text-sm">
                      {new Date(comment.created_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                  <div className="dark:prose-invert max-w-none prose prose-sm">
                    <p className="whitespace-pre-wrap">{comment.body}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
