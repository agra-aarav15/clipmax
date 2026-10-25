import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { supabase, user } = await getCurrentUser();

  let credits: number | null = null;
  if (supabase && user) {
    const { data } = await supabase
      .from("credit_wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    if (typeof data?.balance === "number") credits = data.balance;
  }

  return (
    <AppShell configured={Boolean(supabase)} userEmail={user?.email ?? null} credits={credits}>
      {children}
    </AppShell>
  );
}
