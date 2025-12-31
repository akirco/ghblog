"use client";

import { Bilibili } from "@/components/extensions/bilibili";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Label as LabelType } from "@/lib/github";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Emoji, { gitHubEmojis } from "@tiptap/extension-emoji";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { all, createLowlight } from "lowlight";
import {
  Bold,
  Check,
  Code,
  Code2,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Maximize,
  Minimize,
  Plus,
  Quote,
  Redo,
  Strikethrough,
  Tag,
  Trash2,
  Undo,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  labels?: string[];
  onLabelsChange?: (labels: string[]) => void;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  labels = [],
  onLabelsChange,
}: TiptapEditorProps) {
  const [isClient, setIsClient] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showCreateLabelDialog, setShowCreateLabelDialog] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<LabelType[]>([]);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3FB950");
  const [newLabelDescription, setNewLabelDescription] = useState("");
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadLabels = useCallback(async () => {
    setIsLoadingLabels(true);
    try {
      const response = await fetch("/api/labels");
      if (!response.ok) {
        throw new Error("Failed to load labels");
      }
      const labels = await response.json();
      setAvailableLabels(labels);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load labels",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLabels(false);
    }
  }, [toast]);

  useEffect(() => {
    loadLabels();
  }, [loadLabels]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isFullscreen]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleLabelToggle = (labelName: string) => {
    const newSelected = labels.includes(labelName)
      ? labels.filter((name) => name !== labelName)
      : [...labels, labelName];

    onLabelsChange?.(newSelected);
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      toast({
        title: "Error",
        description: "Label name is required",
        variant: "destructive",
      });
      return;
    }

    // Prevent creation of the special "pinned" label
    if (newLabelName.toLowerCase() === "pinned") {
      toast({
        title: "Error",
        description: "Label name 'pinned' is reserved for system use",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingLabel(true);
    try {
      const response = await fetch("/api/labels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newLabelName,
          color: newLabelColor,
          description: newLabelDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create label");
      }

      const newLabel = await response.json();

      // Add to available labels
      setAvailableLabels((prev) => [...prev, newLabel]);

      // Select the new label
      const newSelected = [...labels, newLabel.name];
      onLabelsChange?.(newSelected);

      // Reset form
      setNewLabelName("");
      setNewLabelColor("#3FB950");
      setNewLabelDescription("");
      setShowCreateLabelDialog(false);

      toast({
        title: "Success",
        description: `Label "${newLabel.name}" created`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create label",
        variant: "destructive",
      });
    } finally {
      setIsCreatingLabel(false);
    }
  };

  const handleDeleteLabel = async (labelName: string) => {
    if (labelName === "pinned") {
      toast({
        title: "Error",
        description: "Cannot delete the 'pinned' label",
        variant: "destructive",
      });
      return;
    }

    // if (!confirm(`Are you sure you want to delete label "${labelName}"?`)) {
    //   return;
    // }

    try {
      const response = await fetch(
        `/api/labels?name=${encodeURIComponent(labelName)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to delete label: ${response.statusText}`
        );
      }

      // Remove from available labels
      setAvailableLabels((prev) =>
        prev.filter((label) => label.name !== labelName)
      );

      toast({
        title: "Success",
        description: `Label "${labelName}" deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete label",
        variant: "destructive",
      });
    }
  };

  const lowlight = createLowlight(all);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: "bg-indigo-500 text-white font-semibold rounded px-1",
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "javascript",
        languageClassPrefix: "language-",
        HTMLAttributes: {
          class: "hljs",
        },
      }),
      Emoji.configure({
        emojis: gitHubEmojis,
        enableEmoticons: true,
      }),
      Youtube.configure({
        inline: false,
        allowFullscreen: true,
        nocookie: true,
        HTMLAttributes: {
          class: "rounded-lg my-4",
        },
      }),
      Bilibili.configure({
        inline: false,
        allowFullscreen: true,
        nocookie: true,
        HTMLAttributes: {
          class: "rounded-lg my-4",
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none focus:outline-none min-h-[400px] px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const addImageFromUrl = useCallback(() => {
    if (!editor || !imageUrl) return;

    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl("");
    setShowImageDialog(false);

    toast({
      title: "Image added",
      description: "Image has been inserted into the editor",
    });
  }, [editor, imageUrl, toast]);

  const uploadImageToGitHub = useCallback(
    async (file: File) => {
      if (!editor) return;

      setIsUploading(true);

      try {
        toast({
          title: "Uploading image...",
          description: "Compressing and uploading to GitHub",
        });

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to upload image");
        }

        const data = await response.json();

        // if (data.url.startsWith("https://raw.githubusercontent.com/")) {
        //   data.url = data.url.replace(
        //     "https://raw.githubusercontent.com/",
        //     "https://cdn.jsdelivr.net/gh/"
        //   );
        // }

        editor.chain().focus().setImage({ src: data.url }).run();

        toast({
          title: "Image uploaded!",
          description: `Uploaded to ${data.path}`,
        });
      } catch (error) {
        console.error("Upload failed:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Failed to upload image";
        const isPermissionError =
          errorMessage.includes("permission") ||
          errorMessage.includes("Permission");

        if (isPermissionError) {
          toast({
            title: "Permission denied",
            description:
              "GitHub token needs 'Contents: Write' permission. Please use 'Insert from URL' tab or update your token at github.com/settings/tokens with 'repo' scope.",
            variant: "destructive",
            duration: 15000,
          });
        } else {
          toast({
            title: "Upload failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } finally {
        setIsUploading(false);
        setShowImageDialog(false);
      }
    },
    [editor, toast]
  );

  const handleFileUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      await uploadImageToGitHub(file);
    };

    input.click();
  }, [uploadImageToGitHub]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor || !isClient) {
    return <div className="bg-muted rounded-lg min-h-100 animate-pulse" />;
  }

  return (
    <>
      <div
        className={`bg-background border rounded-lg flex flex-col ${
          isFullscreen ? "fixed inset-0 z-50 rounded-none border-none" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-1 p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            data-active={editor.isActive("bold")}
            className="data-[active=true]:bg-muted px-2 h-8"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            data-active={editor.isActive("italic")}
            className="data-[active=true]:bg-muted px-2 h-8"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            data-active={editor.isActive("strike")}
            className="data-[active=true]:bg-muted px-2 h-8"
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            data-active={editor.isActive("code")}
            className="data-[active=true]:bg-muted px-2 h-8"
          >
            <Code className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            data-active={editor.isActive("codeBlock")}
            className="data-[active=true]:bg-muted px-2 h-8"
          >
            <Code2 className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            data-active={editor.isActive("heading", { level: 1 })}
            className="data-[active=true]:bg-muted px-2 h-8"
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            data-active={editor.isActive("heading", { level: 2 })}
            className="data-[active=true]:bg-muted px-2 h-8"
          >
            <Heading2 className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            data-active={editor.isActive("bulletList")}
            className="data-[active=true]:bg-muted px-2 h-8"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            data-active={editor.isActive("orderedList")}
            className="data-[active=true]:bg-muted px-2 h-8"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            data-active={editor.isActive("blockquote")}
            className="data-[active=true]:bg-muted px-2 h-8"
          >
            <Quote className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Button
            variant="ghost"
            size="sm"
            onClick={setLink}
            className="px-2 h-8"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImageDialog(true)}
            disabled={isUploading}
            className="px-2 h-8"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4" />
            )}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2 h-8">
                <Tag className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-64" align="start">
              <div className="p-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm">Labels</span>
                  <PopoverClose className="hover:bg-muted p-1 rounded">
                    <X className="w-3 h-3" />
                  </PopoverClose>
                </div>

                {isLoadingLabels ? (
                  <div className="py-4 text-center">
                    <p className="text-muted-foreground text-sm">
                      Loading labels...
                    </p>
                  </div>
                ) : availableLabels.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-muted-foreground text-sm">
                      No labels available
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-60 overflow-y-auto scrollbar-thin">
                    {availableLabels
                      .slice() // Create a copy to avoid mutating original array
                      .sort((a, b) => {
                        const aSelected = labels.includes(a.name);
                        const bSelected = labels.includes(b.name);
                        if (aSelected && !bSelected) return -1;
                        if (!aSelected && bSelected) return 1;
                        return a.name.localeCompare(b.name);
                      })
                      .map((label) => {
                        const isSelected = labels.includes(label.name);
                        const isPinnedLabel = label.name === "pinned";
                        return (
                          <div
                            key={label.id}
                            className="group flex justify-between items-center hover:bg-muted rounded"
                          >
                            <button
                              onClick={() => handleLabelToggle(label.name)}
                              className="flex flex-1 items-center gap-2 p-2 text-sm text-left"
                            >
                              <div
                                className="flex justify-center items-center border-2 rounded w-4 h-4"
                                style={{ borderColor: `#${label.color}` }}
                              >
                                {isSelected && (
                                  <Check
                                    className="w-3 h-3"
                                    style={{ color: `#${label.color}` }}
                                  />
                                )}
                              </div>
                              <div className="flex flex-1 items-center gap-2">
                                <div
                                  className="rounded-full w-3 h-3"
                                  style={{ backgroundColor: `#${label.color}` }}
                                />
                                <span className="truncate">{label.name}</span>
                              </div>
                            </button>
                            {!isPinnedLabel && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLabel(label.name);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive transition-opacity"
                                title={`Delete label "${label.name}"`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}

                <div className="mt-2 pt-2 border-t">
                  <PopoverClose asChild>
                    <button
                      onClick={() => setShowCreateLabelDialog(true)}
                      className="flex justify-center items-center gap-2 hover:bg-muted p-2 rounded w-full text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Create new label
                    </button>
                  </PopoverClose>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="px-2 h-8"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="px-2 h-8"
          >
            <Redo className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="px-2 h-8"
            data-active={isFullscreen}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </Button>
        </div>

        <EditorContent
          editor={editor}
          className={`flex-1 ${
            isFullscreen ? "overflow-y-auto scrollbar-thin" : ""
          }`}
        />
      </div>

      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogDescription>
              Add an image from a URL or upload to GitHub repository.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="url">From URL</TabsTrigger>
              <TabsTrigger value="upload">Upload to GitHub</TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addImageFromUrl();
                    }
                  }}
                />
                <p className="text-muted-foreground text-xs">
                  You can use external image hosting services like Imgur,
                  Cloudinary, or any public URL
                </p>
              </div>
              <DialogFooter>
                <Button onClick={addImageFromUrl} disabled={!imageUrl}>
                  Insert Image
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-2">
                <Label>Upload to GitHub Repository</Label>
                <p className="text-muted-foreground text-sm">
                  Images will be compressed and stored in the repository under
                  images/year/month/day/
                </p>
                <div className="p-6 border border-dashed rounded-lg text-center">
                  <Button
                    onClick={handleFileUpload}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImagePlus className="mr-2 w-4 h-4" />
                        Choose Image File
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-amber-600 text-xs">
                  Note: This requires your GitHub token to have &apos;Contents:
                  Write&apos; permission (repo scope)
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Create Label Dialog */}
      <Dialog
        open={showCreateLabelDialog}
        onOpenChange={setShowCreateLabelDialog}
      >
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Create New Label</DialogTitle>
            <DialogDescription>
              Create a new label to categorize your content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label-name">Label Name</Label>
              <Input
                id="label-name"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="bug, enhancement, documentation..."
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="label-color">Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="label-color"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                  className="w-10 h-10 cursor-pointer"
                />
                <Input
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                  placeholder="#3FB950"
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label-description">Description (optional)</Label>
              <Input
                id="label-description"
                value={newLabelDescription}
                onChange={(e) => setNewLabelDescription(e.target.value)}
                placeholder="Brief description of this label..."
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={handleCreateLabel}
              disabled={isCreatingLabel || !newLabelName.trim()}
            >
              {isCreatingLabel ? "Creating..." : "Create Label"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
