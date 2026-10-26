"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin console failed to load:", error);
  }, [error]);

  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center py-12 text-center">
      <AlertTriangle
        className="h-10 w-10 text-destructive"
        aria-hidden="true"
      />
      <h1 className="mt-4 text-2xl font-bold">Admin console unavailable</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        We couldn&apos;t load the moderation queues. They may be temporarily
        unavailable. Try loading the console again.
      </p>
      <Button className="mt-5" variant="gradient" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
