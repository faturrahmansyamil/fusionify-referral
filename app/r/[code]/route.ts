import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { CAMPAIGN_COOKIE, REF_COOKIE, REF_MAX_AGE, VISITOR_COOKIE, campaignFromParams, cleanCode } from "@/lib/attribution";
import { hashId } from "@/lib/hash";

const cookieOpts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: REF_MAX_AGE };

/** /r/KODE?c=kampanye → catat klik, set cookie 30 hari (last-click), redirect ke katalog. */
export async function GET(req: NextRequest, ctx: RouteContext<"/r/[code]">) {
  const { code: raw } = await ctx.params;
  const res = NextResponse.redirect(new URL("/", req.url));
  const code = cleanCode(raw);
  if (!code) return res;
  const campaign = campaignFromParams(req.nextUrl.searchParams);
  const visitor = req.cookies.get(VISITOR_COOKIE)?.value ?? randomUUID();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const { data: valid } = await createAdminClient().rpc("log_click", {
    p_code: code, p_campaign_slug: campaign, p_visitor_hash: hashId(visitor), p_ip_hash: hashId(ip),
  });
  res.cookies.set(VISITOR_COOKIE, visitor, { ...cookieOpts, maxAge: 60 * 60 * 24 * 365 });
  if (valid === true) {
    res.cookies.set(REF_COOKIE, code, cookieOpts);
    if (campaign) res.cookies.set(CAMPAIGN_COOKIE, campaign, cookieOpts);
  }
  return res;
}
