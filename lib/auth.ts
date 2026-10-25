import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string; email: string | null; role: "admin" | "reseller"; status: "pending" | "active" | "banned";
  full_name: string; whatsapp: string | null; payout_method: string | null; payout_account: string | null;
};

export async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  return { supabase, user, profile };
}

/** Dipakai di layout & setiap server action admin. RLS/RPC tetap jadi penjaga terakhir. */
export async function requireAdmin() {
  const s = await getSession();
  if (s.profile?.role !== "admin" || s.profile.status !== "active") redirect("/dashboard");
  return s;
}
