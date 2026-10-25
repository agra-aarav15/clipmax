"use client";

import { CreditCardIcon, LayoutDashboardIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Studio", icon: LayoutDashboardIcon, exact: false },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCardIcon, exact: true },
] as const;

function isActive(pathname: string, href: string, exact: boolean): boolean {
  if (pathname === href) return true;
  return !exact && pathname.startsWith(`${href}/`);
}

export function WorkspaceNav({ variant = "sidebar" }: { variant?: "sidebar" | "mobile" }) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav aria-label="Workspace" className="flex items-center gap-1">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("size-3.5", active && "text-signal")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <ul className="space-y-1">
      {ITEMS.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4", active ? "text-signal" : "text-muted-foreground")} />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
