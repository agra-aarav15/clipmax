import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-md">
        <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">This frame is empty.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The page you asked for does not exist in this build.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </main>
  );
}
