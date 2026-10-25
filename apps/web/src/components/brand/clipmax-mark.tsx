import { cn } from "@/lib/utils";

export function ClipMaxMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-6 text-primary", className)}
    >
      <rect width="24" height="24" rx="6" fill="currentColor" />
      <path d="M9.25 7.5v9L16 12l-6.75-4.5Z" fill="var(--primary-foreground)" />
    </svg>
  );
}
