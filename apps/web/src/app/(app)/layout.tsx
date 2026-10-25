import { getPlan, type PlanTier } from "@clipmax/shared";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { supabase, user } = await getCurrentUser();

  let credits: number | null = null;
  let planTier: PlanTier = "free";
  let displayName: string | null = null;

  if (supabase && user) {
    const [{ data: wallet }, { data: profile }] = await Promise.all([
      supabase.from("credit_wallets").select("balance").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("profiles")
        .select("plan, display_name")
        .eq("id", user.id)
        .maybeSingle<{ plan: string; display_name: string | null }>(),
    ]);

    if (typeof wallet?.balance === "number") credits = wallet.balance;
    if (profile?.plan && getPlan(profile.plan as PlanTier)) planTier = profile.plan as PlanTier;
    displayName = profile?.display_name ?? user.email?.split("@")[0] ?? null;
  }

  return (
    <AppShell
      configured={Boolean(supabase)}
      userEmail={user?.email ?? null}
      credits={credits}
      planTier={planTier}
      displayName={displayName}
    >
      {children}
    </AppShell>
  );
}
