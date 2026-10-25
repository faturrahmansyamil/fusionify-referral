import { codeSchema, slugSchema } from "./validation";

export const REF_COOKIE = "fd_ref";
export const CAMPAIGN_COOKIE = "fd_cmp";
export const VISITOR_COOKIE = "fd_vid";
/** Jendela atribusi link: 30 hari (last-click: klik terbaru menimpa cookie lama). */
export const REF_MAX_AGE = 60 * 60 * 24 * 30;

/** Ambil kode referral yang valid formatnya dari cookie/URL, atau null. */
export function cleanCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const r = codeSchema.safeParse(raw);
  return r.success ? r.data.toUpperCase() : null;
}

/** Slug kampanye dari ?c=slug atau utm_campaign, hanya jika formatnya aman. */
export function campaignFromParams(params: URLSearchParams): string | null {
  const raw = (params.get("c") ?? params.get("utm_campaign") ?? "").toLowerCase();
  const r = slugSchema.safeParse(raw);
  return r.success ? r.data : null;
}

export type Attribution = "none" | "link" | "code";

/** Cermin aturan di SQL create_order (untuk preview di UI): kode diketik menang atas cookie. */
export function resolveAttribution(promoCode: string | null, cookieCode: string | null): Attribution {
  if (promoCode) return "code";
  if (cookieCode) return "link";
  return "none";
}
