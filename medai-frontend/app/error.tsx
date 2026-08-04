"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/error-state";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-lg">
        <ErrorState
          message="An unexpected error occurred while rendering this page."
          onRetry={reset}
        />
      </div>
    </div>
  );
}
