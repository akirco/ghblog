"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Pin, PinOff, Lock, LockOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PostActionsProps {
  issueNumber: number;
  isPinned: boolean;
  isClosed: boolean;
}

export function PostActions({
  issueNumber,
  isPinned,
  isClosed,
}: PostActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/${issueNumber}/pin`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("Failed to pin issue");
      }
      toast({
        title: "Success",
        description: "Post pinned successfully",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to pin post",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnpin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/${issueNumber}/unpin`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("Failed to unpin issue");
      }
      toast({
        title: "Success",
        description: "Post unpinned successfully",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unpin post",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/${issueNumber}/state`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: "closed" }),
      });
      if (!response.ok) {
        throw new Error("Failed to close issue");
      }
      toast({
        title: "Success",
        description: "Post closed successfully",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to close post",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReopen = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/${issueNumber}/state`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: "open" }),
      });
      if (!response.ok) {
        throw new Error("Failed to reopen issue");
      }
      toast({
        title: "Success",
        description: "Post reopened successfully",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reopen post",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {isPinned ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleUnpin}
          disabled={isLoading}
        >
          <PinOff className="mr-2 w-4 h-4" />
          Unpin
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePin}
          disabled={isLoading}
        >
          <Pin className="mr-2 w-4 h-4" />
          Pin
        </Button>
      )}
      {isClosed ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReopen}
          disabled={isLoading}
        >
          <LockOpen className="mr-2 w-4 h-4" />
          Reopen
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClose}
          disabled={isLoading}
        >
          <Lock className="mr-2 w-4 h-4" />
          Close
        </Button>
      )}
    </div>
  );
}