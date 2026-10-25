import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { REFERRAL_SCHEMA } from "./schema";

/** Client Supabase untuk Server Components / Actions, memakai sesi user (anon key + RLS). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: REFERRAL_SCHEMA },
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Dipanggil dari Server Component: abaikan, proxy.ts yang me-refresh sesi.
          }
        },
      },
    },
  );
}
