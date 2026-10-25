"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] route error", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-md">
        <p className="font-mono text-xs tracking-[0.2em] text-destructive uppercase">
          Unhandled error
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">The frame dropped.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Something failed while rendering this route. The error was logged; you can retry the
          request.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground">digest: {error.digest}</p>
        ) : null}
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
