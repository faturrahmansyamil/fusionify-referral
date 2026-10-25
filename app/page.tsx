import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { OrderForm } from "@/components/order-form";
import { Logo } from "@/components/ui";
import { REF_COOKIE, cleanCode } from "@/lib/attribution";

async function Catalog() {
  const supabase = await createClient();
  const jar = await cookies();
  const refCode = cleanCode(jar.get(REF_COOKIE)?.value);
  const { data: products } = await supabase.from("products").select("id,name,description,price").eq("active", true).order("sort");
  return (
    <>
      {refCode && (
        <p className="mb-4 rounded-xl bg-brand-50 px-4 py-2.5 text-sm text-brand-900">
          Kamu datang lewat reseller <b>{refCode}</b>. Pesananmu akan tercatat atas nama mereka.
        </p>
      )}
      <OrderForm products={products ?? []} refCode={refCode} />
    </>
  );
}

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-10">
      <header className="flex items-center justify-between py-5">
        <Logo />
        <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-brand-700">Masuk reseller</Link>
      </header>
      <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-6 text-white sm:p-8">
        <p className="text-xs font-semibold tracking-widest text-brand-100 uppercase">PT Fusionify Digital Store</p>
        <h1 className="mt-2 text-2xl leading-tight font-bold sm:text-3xl">Produk digital, langsung order lewat WhatsApp.</h1>
        <p className="mt-2 max-w-md text-sm text-brand-100">Pilih produk, isi nama &amp; nomor WA, lalu lanjutkan pembayaran dengan admin. Kode pesananmu ikut terkirim otomatis.</p>
        <Link href="/daftar" className="mt-5 inline-flex rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold ring-1 ring-white/30 backdrop-blur hover:bg-white/25">Mau jadi reseller? Daftar →</Link>
      </section>
      <Suspense fallback={<p className="text-sm text-slate-400">Memuat produk…</p>}>
        <Catalog />
      </Suspense>
    </div>
  );
}
