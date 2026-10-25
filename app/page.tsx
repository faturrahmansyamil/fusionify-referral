import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { OrderForm } from "@/components/order-form";
import { Logo, Washes } from "@/components/ui";
import { Announcement } from "@/components/announcement";
import { Hero3D } from "@/components/hero-3d";
import { Reveal } from "@/components/motion";
import { REF_COOKIE, cleanCode } from "@/lib/attribution";

async function Catalog() {
  const supabase = await createClient();
  const jar = await cookies();
  const refCode = cleanCode(jar.get(REF_COOKIE)?.value);
  const { data: products } = await supabase.from("products").select("id,name,description,price").eq("active", true).order("sort");
  return (
    <>
      {refCode && (
        <p className="mb-6 rounded-[24px] bg-periwinkle-mist px-6 py-4 text-[14px]">
          Kamu datang lewat reseller <b className="font-medium">{refCode}</b>. Pesananmu akan tercatat atas nama mereka.
        </p>
      )}
      <OrderForm products={products ?? []} refCode={refCode} />
    </>
  );
}

const FEATURES = [
  { icon: "◎", title: "Link & kode promo", body: "Setiap reseller punya link /r/kode dan kode promo sendiri. Pembeli dapat diskon, kamu dapat komisi." },
  { icon: "↗", title: "Order lewat WhatsApp", body: "Pilih produk, isi nama & nomor WA, lalu lanjutkan pembayaran dengan admin. Kode pesanan ikut terkirim otomatis." },
  { icon: "▤", title: "Slip transparan", body: "Komisi ditahan 7 hari, lalu dicairkan dengan bukti transfer dan slip publik yang bisa dicek kapan saja." },
];

const FAQ = [
  { q: "Bagaimana cara memesan?", a: "Pilih produk di katalog, isi nama dan nomor WhatsApp, lalu klik Pesan via WhatsApp. Admin akan memproses pembayaranmu di chat." },
  { q: "Apa itu kode promo reseller?", a: "Kode dari reseller Fusionify yang memberi diskon untukmu. Kalau datang lewat link reseller, kodenya tercatat otomatis." },
  { q: "Bagaimana cara jadi reseller?", a: "Daftar lewat halaman Daftar reseller, tunggu admin menyetujui akunmu dan membuatkan kode referral, lalu bagikan link-mu." },
  { q: "Kapan komisi bisa dicairkan?", a: "Komisi dari order lunas masuk masa hold 7 hari. Setelah itu statusnya siap dicairkan dan admin mentransfer disertai slip." },
];

export default function Home() {
  return (
    <div className="relative isolate overflow-x-clip">
      <Announcement />
      <header className="mx-auto flex h-20 w-full max-w-[1432px] items-center gap-6 px-4 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-6 text-[14px] uppercase md:flex lg:text-[18px]">
          <a href="#katalog" className="hover:underline">Katalog</a>
          <a href="#fitur" className="hover:underline">Program</a>
          <a href="#faq" className="hover:underline">FAQ</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className="btn-ghost min-h-10 px-5 py-2">Masuk</Link>
          <Link href="/daftar" className="btn-dark hidden min-h-10 px-5 py-2 sm:inline-flex">Daftar</Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-[1432px] px-4 pt-16 pb-8 text-center sm:px-8 sm:pt-24">
        <Washes />
        <p className="eyebrow animate-[fade-up_.6s_var(--ease-premium)_both]">PT Fusionify Digital Store</p>
        <h1 className="mx-auto mt-6 max-w-5xl text-[48px] text-off-black sm:text-[64px] lg:text-[80px] animate-[fade-up_.7s_var(--ease-premium)_.08s_both]">Produk digital, langsung order lewat WhatsApp.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-[16px] text-graphite sm:text-[20px] animate-[fade-up_.7s_var(--ease-premium)_.16s_both]">Pilih produk, isi nama &amp; nomor WA, lalu lanjutkan pembayaran dengan admin. Kode pesananmu ikut terkirim otomatis.</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row animate-[fade-up_.7s_var(--ease-premium)_.24s_both]">
          <a href="#katalog" className="btn-primary w-full sm:w-auto">Pesan sekarang ▸</a>
          <Link href="/daftar" className="btn-ghost w-full sm:w-auto">Mau jadi reseller? Daftar</Link>
        </div>
        <div className="relative mx-auto mt-12 h-[320px] max-w-4xl sm:h-[440px]">
          <Hero3D />
        </div>
      </section>

      <section id="fitur" className="mx-auto max-w-[1432px] px-4 py-16 sm:px-8">
        <Reveal><h2 className="max-w-3xl text-[40px] sm:text-[48px]">Program reseller yang rapi dari klik sampai slip.</h2></Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08} className="card p-8 sm:p-10">
              <span aria-hidden className="text-[20px]">{f.icon}</span>
              <h3 className="mt-6 text-[24px]">{f.title}</h3>
              <p className="mt-3 text-[16px] text-graphite">{f.body}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="card-elevated relative mt-4 overflow-hidden p-8 sm:p-10">
          <div aria-hidden className="pointer-events-none absolute -right-10 -bottom-16 h-72 w-72 sm:right-10">
            <div className="wash top-0 left-0 size-48 bg-coral/80" />
            <div className="wash top-10 left-20 size-48 bg-sky-blue/80" />
            <div className="wash top-24 left-6 size-40 bg-mint/80" />
          </div>
          <div className="relative max-w-xl">
            <p className="eyebrow text-graphite">Untuk reseller</p>
            <h3 className="mt-4 text-[32px] sm:text-[40px]">Dapatkan link + kode promo sendiri dan pantau komisimu.</h3>
            <Link href="/daftar" className="link-arrow mt-6">Daftar reseller →</Link>
          </div>
        </Reveal>
      </section>

      <section id="katalog" className="mx-auto max-w-3xl scroll-mt-6 px-4 py-16 sm:px-8">
        <Reveal>
          <p className="eyebrow">Katalog</p>
          <h2 className="mt-3 mb-8 text-[40px] sm:text-[48px]">Pilih produk</h2>
        </Reveal>
        <Suspense fallback={<p className="text-[14px] text-smoke">Memuat produk…</p>}>
          <Catalog />
        </Suspense>
      </section>

      <section id="faq" className="mx-auto max-w-[1432px] px-4 py-16 sm:px-8">
        <Reveal><h2 className="text-[40px] sm:text-[48px]">Pertanyaan umum</h2></Reveal>
        <div className="mt-8">
          {FAQ.map((f) => (
            <details key={f.q} className="group border-b border-ash py-8 sm:py-10">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-serif text-[24px] leading-tight [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden className="font-mono text-[20px] transition-transform duration-300 group-open:rotate-180">↓</span>
              </summary>
              <p className="mt-4 max-w-3xl text-[16px] text-graphite">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1432px] flex-col gap-4 px-4 py-12 text-[12px] text-smoke uppercase sm:flex-row sm:items-center sm:px-8">
        <Logo />
        <span className="sm:ml-auto">© PT Fusionify Digital Store</span>
      </footer>
    </div>
  );
}
