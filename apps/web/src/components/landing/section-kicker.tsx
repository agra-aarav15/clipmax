import type { ReactNode } from "react";

export function SectionKicker({
  index,
  children,
  className = "",
}: {
  index: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 font-mono text-[9px] tracking-[0.18em] uppercase ${className}`}
    >
      <span className="text-signal">{index}</span>
      <span className="h-px w-8 bg-white/15" aria-hidden="true" />
      <span className="text-zinc-500">{children}</span>
    </div>
  );
}
