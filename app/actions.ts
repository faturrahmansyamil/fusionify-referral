"use server";
import { cookies, headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { orderSchema } from "@/lib/validation";
import { REF_COOKIE, CAMPAIGN_COOKIE, cleanCode } from "@/lib/attribution";
import { hashId } from "@/lib/hash";
import { buildOrderMessage, waLink, type OrderSummary } from "@/lib/wame";

export type OrderResult = { ok: true; waUrl: string; order: OrderSummary } | { ok: false; error: string } | null;

const SAFE_ERRORS = ["kode promo tidak valid", "produk tidak ditemukan", "jumlah tidak valid", "terlalu banyak pesanan, coba lagi nanti"];

export async function createOrder(_: OrderResult, fd: FormData): Promise<OrderResult> {
  const parsed = orderSchema.safeParse({
    productId: fd.get("productId"), qty: fd.get("qty"), buyerName: fd.get("buyerName"),
    buyerWa: fd.get("buyerWa"), promoCode: fd.get("promoCode") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  const number = process.env.FUSIONIFY_WHATSAPP_NUMBER;
  if (!number || !/^62\d{8,13}$/.test(number)) return { ok: false, error: "Nomor WA toko belum diatur" };

  const jar = await cookies();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const d = parsed.data;
  const { data, error } = await createAdminClient().rpc("create_order", {
    p_product_id: d.productId, p_qty: d.qty, p_buyer_name: d.buyerName, p_buyer_wa: d.buyerWa,
    p_promo_code: d.promoCode, p_cookie_code: cleanCode(jar.get(REF_COOKIE)?.value),
    p_campaign_slug: jar.get(CAMPAIGN_COOKIE)?.value ?? null, p_ip_hash: hashId(ip),
  });
  if (error) {
    const msg = SAFE_ERRORS.find((m) => error.message.includes(m));
    return { ok: false, error: msg ? msg[0].toUpperCase() + msg.slice(1) : "Gagal membuat pesanan, coba lagi" };
  }
  const order = data as OrderSummary;
  return { ok: true, order, waUrl: waLink(number, buildOrderMessage(order, d.buyerName)) };
}
