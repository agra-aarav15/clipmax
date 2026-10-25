"use client";

import { ChevronDownIcon, LogOutIcon, SettingsIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function UserMenu({
  email,
  plan,
  compact = false,
}: {
  email: string | null;
  plan: string;
  compact?: boolean;
}) {
  const initial = (email?.[0] ?? "?").toUpperCase();
  const label = email ?? "Not signed in";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex items-center gap-2.5 rounded-xl text-left outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-signal/70",
            compact
              ? "size-9 justify-center"
              : "w-full border border-white/[0.06] bg-white/[0.025] p-2 hover:border-white/10 hover:bg-white/[0.045]",
          )}
          aria-label={`Account menu for ${label}`}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-signal/20 bg-signal/[0.08] font-mono text-[11px] font-medium text-signal">
            {initial}
          </span>
          {compact ? null : (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium text-zinc-200">{label}</span>
                <span className="mt-0.5 block font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
                  {plan} plan
                </span>
              </span>
              <ChevronDownIcon className="size-3.5 shrink-0 text-zinc-600 transition-transform group-data-[state=open]:rotate-180" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="top" sideOffset={8} className="w-60 p-1.5">
        <DropdownMenuLabel className="px-2.5 py-2">
          <span className="block truncate text-[12px] font-medium text-zinc-200">{label}</span>
          <span className="mt-0.5 block font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
            Signed in · {plan}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="px-2.5 py-2">
          <Link href="/dashboard/settings">
            <UserRoundIcon className="text-zinc-500" />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="px-2.5 py-2">
          <Link href="/dashboard/settings">
            <SettingsIcon className="text-zinc-500" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action="/auth/signout" method="post">
          <DropdownMenuItem asChild variant="destructive" className="px-2.5 py-2">
            <button type="submit" className="w-full">
              <LogOutIcon />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
