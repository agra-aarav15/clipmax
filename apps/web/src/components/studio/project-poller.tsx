"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Refreshes a server-rendered studio page while a job is still moving.
 *
 * This is a poll of the real database-backed page, not a simulated progress bar. It stops as soon
 * as the project reaches a terminal state, and pauses while the tab is hidden.
 */
export function ProjectPoller({
  active,
  intervalMs = 5000,
}: {
  active: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [active, intervalMs, router]);

  return null;
}
