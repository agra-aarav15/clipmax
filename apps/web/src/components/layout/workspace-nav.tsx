"use client";

import {
  CreditCardIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const GROUPS = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Studio", icon: LayoutDashboardIcon, exact: true },
      { href: "/dashboard/projects", label: "Projects", icon: FolderOpenIcon, exact: false },
      { href: "/dashboard/billing", label: "Billing", icon: CreditCardIcon, exact: false },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon, exact: false },
      { href: "/support", label: "Help & support", icon: LifeBuoyIcon, exact: false },
    ],
  },
] as const;

function isActive(pathname: string, href: string, exact: boolean): boolean {
  if (pathname === href) return true;
  if (exact) return false;
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(`${href}/`) || pathname === href;
}

export function WorkspaceNav({
  variant = "sidebar",
  onNavigate,
}: {
  variant?: "sidebar" | "mobile";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <div className="space-y-6">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-1 font-mono text-[0.5625rem] tracking-[0.22em] text-zinc-600 uppercase">
              {group.label}
            </p>
            <ul className="mt-2 space-y-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href, item.exact);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors",
                        active
                          ? "bg-white/[0.07] text-white"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-white",
                      )}
                    >
                      <Icon className={cn("size-4.5", active ? "text-signal" : "text-zinc-500")} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 font-mono text-[0.5625rem] tracking-[0.22em] text-zinc-600 uppercase">
            {group.label}
          </p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-white/[0.055] text-white"
                        : "text-zinc-400 hover:bg-white/[0.035] hover:text-zinc-100",
                    )}
                  >
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="absolute top-1/2 -left-4 h-4 w-0.5 -translate-y-1/2 rounded-full bg-signal shadow-[0_0_12px_rgba(155,231,255,0.6)]"
                      />
                    ) : null}
                    <Icon
                      className={cn(
                        "size-4 transition-colors",
                        active ? "text-signal" : "text-zinc-500 group-hover:text-zinc-300",
                      )}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
