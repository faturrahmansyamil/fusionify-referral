"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { codeSchema, slugSchema } from "@/lib/validation";

export type Msg = string | null;
const id = z.uuid();
const fail = (e: { message: string } | null, ok = "Berhasil ✓") => (e ? `Gagal: ${e.message}` : ok);

async function rpc(name: string, args: Record<string, unknown>, path: string, ok?: string): Promise<Msg> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc(name, args);
  revalidatePath(path);
  return fail(error, ok);
}

export async function markPaid(_: Msg, fd: FormData) {
  const p = id.safeParse(fd.get("id")); if (!p.success) return "ID tidak valid";
  return rpc("mark_order_paid", { p_order_id: p.data }, "/admin", "Ditandai lunas ✓");
}
export async function setOrderStatus(_: Msg, fd: FormData) {
  const p = z.object({ id, status: z.enum(["cancelled", "refunded"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return "Data tidak valid";
  return rpc("set_order_status", { p_order_id: p.data.id, p_status: p.data.status }, "/admin");
}
export async function approveMatured(): Promise<Msg> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("approve_matured_commissions");
  revalidatePath("/admin");
  return fail(error, `${data ?? 0} komisi di-approve ✓`);
}
export async function reviewCommission(_: Msg, fd: FormData) {
  const p = z.object({ id, approve: z.enum(["1", "0"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return "Data tidak valid";
  return rpc("review_commission", { p_commission_id: p.data.id, p_approve: p.data.approve === "1" }, "/admin");
}
export async function setResellerStatus(_: Msg, fd: FormData) {
  const p = z.object({ id, status: z.enum(["active", "banned", "pending"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return "Data tidak valid";
  return rpc("set_reseller_status", { p_profile_id: p.data.id, p_status: p.data.status }, "/admin/reseller");
}
export async function createCode(_: Msg, fd: FormData): Promise<Msg> {
  const p = z.object({ resellerId: id, code: codeSchema, discount: z.coerce.number().int().min(0).max(50) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return p.error.issues[0]?.message ?? "Data tidak valid";
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("referral_codes").insert({ reseller_id: p.data.resellerId, code: p.data.code.toUpperCase(), discount_percent: p.data.discount });
  revalidatePath("/admin/reseller");
  return error?.code === "23505" ? "Kode sudah dipakai" : fail(error, "Kode dibuat ✓");
}
export async function saveProduct(_: Msg, fd: FormData): Promise<Msg> {
  const p = z.object({
    name: z.string().trim().min(2).max(120), description: z.string().trim().max(300),
    price: z.coerce.number().int().min(1), commissionType: z.enum(["percent", "flat"]), commissionValue: z.coerce.number().int().min(0),
  }).refine((v) => v.commissionType === "flat" || v.commissionValue <= 100, "Persen maks 100").safeParse(Object.fromEntries(fd));
  if (!p.success) return p.error.issues[0]?.message ?? "Data tidak valid";
  const { supabase } = await requireAdmin();
  const d = p.data;
  const { error } = await supabase.from("products").insert({ name: d.name, description: d.description, price: d.price, commission_type: d.commissionType, commission_value: d.commissionValue });
  revalidatePath("/admin/produk");
  return fail(error, "Produk ditambah ✓");
}
export async function toggleProduct(_: Msg, fd: FormData): Promise<Msg> {
  const p = z.object({ id, active: z.enum(["true", "false"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return "Data tidak valid";
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("products").update({ active: p.data.active === "true" }).eq("id", p.data.id);
  revalidatePath("/admin/produk");
  return fail(error);
}
export async function saveCampaign(_: Msg, fd: FormData): Promise<Msg> {
  const p = z.object({ name: z.string().trim().min(2).max(80), slug: slugSchema, utmSource: z.string().trim().max(40), utmMedium: z.string().trim().max(40) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return p.error.issues[0]?.message ?? "Slug: huruf kecil, angka, strip";
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("campaigns").insert({ name: p.data.name, slug: p.data.slug, utm_source: p.data.utmSource || null, utm_medium: p.data.utmMedium || null, utm_campaign: p.data.slug });
  revalidatePath("/admin/kampanye");
  return error?.code === "23505" ? "Slug sudah dipakai" : fail(error, "Kampanye dibuat ✓");
}
export async function createPayout(_: Msg, fd: FormData) {
  const p = id.safeParse(fd.get("resellerId")); if (!p.success) return "ID tidak valid";
  return rpc("create_payout", { p_reseller_id: p.data }, "/admin/payout", "Payout dibuat ✓");
}
export async function markPayoutPaid(_: Msg, fd: FormData) {
  const p = z.object({ id, proofUrl: z.url({ protocol: /^https$/ }) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return "Link bukti harus https://";
  return rpc("mark_payout_paid", { p_payout_id: p.data.id, p_proof_url: p.data.proofUrl }, "/admin/payout", "Ditandai dibayar ✓");
}
