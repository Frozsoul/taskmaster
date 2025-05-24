
"use client"; 

import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";

export default function Error({
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
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
      <TriangleAlert className="h-16 w-16 text-destructive mb-6" />
      <h2 className="text-3xl font-semibold text-foreground mb-2">Oops! Something went wrong.</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        We encountered an unexpected issue. Please try again. If the problem persists, contact support.
      </p>
      <Button
        onClick={() => reset()}
        variant="default"
        size="lg"
      >
        Try Again
      </Button>
      {error?.digest && <p className="mt-4 text-xs text-muted-foreground">Error Digest: {error.digest}</p>}
    </div>
  );
}
