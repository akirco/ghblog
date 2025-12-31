"use client";

import { TiptapEditor } from "@/components/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GITHUB_ISSUE_MAX_LENGTH } from "@/lib/github";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CodeHighlighter } from "./code-highlighter";

interface EditorProps {
  initialTitle?: string;
  initialContent?: string;
  initialLabels?: string[];
  issueNumber?: number;
  mode: "create" | "edit";
}

export function Editor({
  initialTitle = "",
  initialContent = "",
  initialLabels = [],
  issueNumber,
  mode,
}: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [labels, setLabels] = useState<string[]>(initialLabels);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const router = useRouter();

  const contentLength = content.length;
  const isContentTooLong = contentLength > GITHUB_ISSUE_MAX_LENGTH;
  const isNearLimit = contentLength > GITHUB_ISSUE_MAX_LENGTH * 0.9;

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please provide both title and content");
      return;
    }

    if (isContentTooLong) {
      alert(
        `Content is too long! Maximum allowed is ${GITHUB_ISSUE_MAX_LENGTH.toLocaleString()} characters. Current length is ${contentLength.toLocaleString()} characters. Please reduce the content by ${(
          contentLength - GITHUB_ISSUE_MAX_LENGTH
        ).toLocaleString()} characters.`
      );
      return;
    }

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const endpoint =
        mode === "create" ? "/api/posts" : `/api/posts/${issueNumber}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body: content, labels }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save post");
      }

      const data = await response.json();
      setSaveStatus("saved");

      setTimeout(() => {
        router.push(`/posts/${data.number}`);
      }, 500);
    } catch (error) {
      console.error("Error saving post:", error);
      setSaveStatus("error");
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save post. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4 text-sm">
          <div
            className={`flex items-center gap-2 ${
              isContentTooLong
                ? "text-destructive"
                : isNearLimit
                ? "text-orange-600"
                : "text-muted-foreground"
            }`}
          >
            {isContentTooLong && <AlertTriangle className="w-4 h-4" />}
            <span>
              {contentLength.toLocaleString()} /{" "}
              {GITHUB_ISSUE_MAX_LENGTH.toLocaleString()} characters
            </span>
          </div>
          {saveStatus === "saved" && (
            <span className="text-green-600">Saved!</span>
          )}
          {saveStatus === "error" && (
            <span className="text-destructive">Error saving</span>
          )}
        </div>
        <Button onClick={handleSave} disabled={isSaving || isContentTooLong}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 w-4 h-4" />
              Publish
            </>
          )}
        </Button>
      </div>

      {isContentTooLong && (
        <div className="bg-destructive/10 mb-4 p-4 border border-destructive rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <h4 className="font-semibold text-destructive">
                Content too long
              </h4>
              <p className="mt-1 text-destructive/90 text-sm">
                Your content exceeds the GitHub Issues limit by{" "}
                {(contentLength - GITHUB_ISSUE_MAX_LENGTH).toLocaleString()}{" "}
                characters. Please reduce the content before publishing.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="bg-transparent border-0 focus:outline-none focus:ring-0 w-full font-bold placeholder:text-muted-foreground text-4xl tracking-tight"
        />

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-100">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="mt-6">
            <TiptapEditor
              content={content}
              onChange={setContent}
              placeholder="Tell your story..."
              labels={labels}
              onLabelsChange={setLabels}
            />
          </TabsContent>
          <TabsContent value="preview" className="mt-6">
            <div className="bg-background p-6 border rounded-lg min-h-100">
              {content ? (
                <CodeHighlighter html={content} />
              ) : (
                <p className="text-muted-foreground">
                  Nothing to preview yet. Start writing!
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
