import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { REFERRAL_SCHEMA } from "@/lib/supabase/schema";

// Refresh sesi Supabase & lindungi /dashboard dan /admin (cek peran admin ada di layout + RPC).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    db: { schema: REFERRAL_SCHEMA }, // proxy hanya memakai auth, tapi tetap konsisten
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const p = request.nextUrl.pathname;
  if (!user && (p.startsWith("/dashboard") || p.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*", "/login"] };
