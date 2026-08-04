"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 p-10 text-center"
    >
      <AlertTriangle className="mb-3 h-10 w-10 text-destructive" />
      <p className="font-semibold text-destructive">Something went wrong</p>
      {message && (
        <p className="mt-1 max-w-md text-sm text-destructive/80">{message}</p>
      )}
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
