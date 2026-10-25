import Link from "next/link";

const ITEMS = [
  { id: "cutting-room", href: "/lab/cutting-room", label: "Cutting Room", dot: "#FFA24B" },
  { id: "paper-edit", href: "/lab/paper-edit", label: "Paper Edit", dot: "#E2402C" },
  { id: "hook-machine", href: "/lab/hook-machine", label: "Hook Machine", dot: "#D8FF3E" },
  { id: "gallery", href: "/lab/gallery", label: "Gallery", dot: "#EDE7DB" },
] as const;

export function LabNav({ active }: { active: string }) {
  return (
    <div className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#070708]/90 backdrop-blur-md">
      <div className="mx-auto flex h-9 w-full max-w-[1360px] items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-3 overflow-x-auto [scrollbar-width:none]">
          <span className="shrink-0 font-mono text-[8px] tracking-[0.16em] text-zinc-600 uppercase">
            Design lab
          </span>
          <span className="hidden h-3 w-px shrink-0 bg-white/10 sm:block" aria-hidden="true" />
          <nav aria-label="Design lab" className="flex shrink-0 items-center gap-1">
            {ITEMS.map((item) => {
              const isActive = item.id === active;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] transition-colors ${
                    isActive
                      ? "bg-white/[0.08] text-white"
                      : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: item.dot }}
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <Link
          href="/directions"
          className="shrink-0 font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase transition-colors hover:text-zinc-300"
        >
          Board
        </Link>
      </div>
    </div>
  );
}
