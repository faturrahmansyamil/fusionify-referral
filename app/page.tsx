import { Suspense, cache } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { OrderForm } from "@/components/order-form";
import { Logo, Washes } from "@/components/ui";
import { Hero3D } from "@/components/hero-3d";
import { Reveal } from "@/components/motion";
import { REF_COOKIE, cleanCode } from "@/lib/attribution";
import { cleanName } from "@/lib/product-meta";

const getProducts = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("id,name,description,price").eq("active", true).order("sort");
  return data ?? [];
});

async function Catalog() {
  const jar = await cookies();
  const refCode = cleanCode(jar.get(REF_COOKIE)?.value);
  const products = await getProducts();
  return (
    <>
      {refCode && (
        <p className="mb-6 rounded-[24px] bg-periwinkle-mist px-6 py-4 text-[14px]">
          Kamu datang lewat reseller <b className="font-medium">{refCode}</b>. Pesananmu akan tercatat atas nama mereka.
        </p>
      )}
      <OrderForm products={products} refCode={refCode} />
    </>
  );
}

async function Marquee() {
  const names = (await getProducts()).map((p) => cleanName(p.name));
  if (!names.length) return null;
  const row = [...names, ...names];
  return (
    <div className="marquee-wrap overflow-hidden border-y border-navy-2 bg-navy py-5 text-parchment" aria-label="Produk Fusionify">
      <ul className="marquee gap-10 pr-10">
        {row.map((n, i) => (
          <li key={i} aria-hidden={i >= names.length || undefined} className="flex shrink-0 items-center gap-10 font-serif text-[28px] whitespace-nowrap sm:text-[36px]">
            {n}<span className="text-lake-blue">✦</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function ProductCount() {
  const n = (await getProducts()).length;
  return <span data-count={n}>{n}</span>;
}

const STEPS = [
  { n: "01", t: "Daftar reseller", d: "Buat akun, admin menyetujui dan membuatkan kode referral untukmu." },
  { n: "02", t: "Bagikan link", d: "Sebar link /r/kode atau kode promo di story IG, grup WA, atau ke teman." },
  { n: "03", t: "Pembeli order", d: "Pembeli pesan lewat WhatsApp. Kode pesanan & referral tercatat otomatis." },
  { n: "04", t: "Komisi cair", d: "Setelah lunas & masa hold 7 hari, komisi ditransfer lengkap dengan slip." },
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

      {/* HERO — navy stage with the 3D S-form */}
      <section data-hero="" className="relative isolate overflow-hidden bg-navy text-parchment">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="wash wash-anim -top-32 -left-24 h-96 w-[30rem] bg-lake-blue/60" />
          <div className="wash wash-anim top-1/3 -right-24 h-96 w-[28rem] bg-ice/25" />
          <div className="wash wash-anim -bottom-40 left-1/4 h-80 w-[26rem] bg-lake-deep/70" />
          <div className="grain absolute inset-0" />
        </div>
        <header className="relative z-10 mx-auto flex h-20 w-full max-w-[1432px] items-center gap-6 px-4 sm:px-8">
          <Logo light />
          <nav className="hidden items-center gap-6 text-[14px] uppercase md:flex lg:text-[18px]">
            <a href="#katalog" className="hover:text-ice">Katalog</a>
            <a href="#cara-kerja" className="hover:text-ice">Cara kerja</a>
            <a href="#fitur" className="hover:text-ice">Program</a>
            <a href="#faq" className="hover:text-ice">FAQ</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="btn-ghost-light min-h-10 px-5 py-2">Masuk</Link>
            <Link href="/daftar" className="btn-light hidden min-h-10 px-5 py-2 sm:inline-flex">Daftar</Link>
          </div>
        </header>

        <div className="relative mx-auto grid max-w-[1432px] items-center gap-4 px-4 pt-8 pb-16 sm:px-8 lg:min-h-[720px] lg:grid-cols-[1.05fr_1fr] lg:pt-0">
          <div data-hero-copy="" className="relative z-10 text-center lg:text-left">
            <p className="eyebrow text-ice animate-[fade-up_.6s_var(--ease-premium)_both]">PT Fusionify Digital Store · Program Reseller</p>
            <h1 className="mt-6 text-[48px] sm:text-[68px] lg:text-[84px] animate-[rise_.8s_var(--ease-premium)_both]">Produk digital, langsung order lewat <span className="text-ice">WhatsApp.</span></h1>
            <p className="mx-auto mt-6 max-w-xl text-[16px] text-frost/80 sm:text-[20px] lg:mx-0 animate-[fade-up_.7s_var(--ease-premium)_.16s_both]">Pilih produk, isi nama &amp; nomor WA, lalu lanjutkan pembayaran dengan admin. Kode pesananmu ikut terkirim otomatis.</p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center animate-[fade-up_.7s_var(--ease-premium)_.24s_both]">
              <a href="#katalog" data-magnetic="" className="btn-primary w-full sm:w-auto">Pesan sekarang ▸</a>
              <Link href="/daftar" data-magnetic="" className="btn-ghost-light w-full sm:w-auto">Mau jadi reseller? Daftar</Link>
            </div>
          </div>
          <div className="relative h-[360px] sm:h-[480px] lg:-ml-40 lg:h-[640px]">
            <Hero3D />
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="h-[78px] bg-navy sm:h-[92px]" />}><Marquee /></Suspense>

      {/* STATS — facts from the program rules */}
      <section className="mx-auto max-w-[1432px] px-4 py-20 sm:px-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[28px] border border-ash bg-ash sm:rounded-[40px] lg:grid-cols-4">
          {[
            { v: <><span data-count="15" data-suffix="%">15%</span></>, l: "Komisi hingga, per order lunas" },
            { v: <><span data-count="7">7</span> hari</>, l: "Masa hold sebelum dicairkan" },
            { v: <><span data-count="30">30</span> hari</>, l: "Link referral tetap tercatat" },
            { v: <Suspense fallback={<span>–</span>}><ProductCount /></Suspense>, l: "Produk aktif di katalog" },
          ].map((s, i) => (
            <Reveal key={i} delay={0} className="bg-parchment p-6 sm:p-10">
              <p className="font-serif text-[44px] leading-none text-navy tabular-nums sm:text-[64px]">{s.v}</p>
              <p className="eyebrow mt-4">{s.l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CARA KERJA — dark contrast section */}
      <section id="cara-kerja" className="relative isolate scroll-mt-6 overflow-hidden bg-navy py-20 text-parchment sm:py-28">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"><div className="wash wash-anim top-0 right-0 h-96 w-96 bg-lake-blue/40" /><div className="grain absolute inset-0" /></div>
        <div className="mx-auto max-w-[1432px] px-4 sm:px-8">
          <Reveal><p className="eyebrow text-ice">Cara kerja</p><h2 className="mt-3 max-w-3xl text-[40px] sm:text-[56px]">Dari klik sampai komisi cair, semuanya tercatat.</h2></Reveal>
          <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <Reveal as="li" key={s.n} className="rounded-[28px] border border-parchment/15 bg-navy-2/60 p-8 sm:rounded-[40px]">
                <span className="font-serif text-[56px] leading-none text-lake-blue">{s.n}</span>
                <h3 className="mt-6 text-[26px]">{s.t}</h3>
                <p className="mt-3 text-[15px] text-frost/75">{s.d}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* BENTO — program features */}
      <section id="fitur" className="mx-auto max-w-[1432px] px-4 py-20 sm:px-8 sm:py-28">
        <Reveal><p className="eyebrow">Program reseller</p><h2 className="mt-3 max-w-3xl text-[40px] sm:text-[56px]">Program reseller yang rapi dari klik sampai slip.</h2></Reveal>
        <div className="mt-12 grid auto-rows-[minmax(220px,auto)] gap-4 md:grid-cols-6">
          <Reveal className="card-elevated relative overflow-hidden p-8 sm:p-10 md:col-span-4 md:row-span-2" >
            <div aria-hidden className="pointer-events-none absolute -right-16 -bottom-20 size-80">
              <div className="wash wash-anim top-0 left-0 size-56 bg-lake-blue/50" />
              <div className="wash wash-anim top-16 left-24 size-48 bg-ice" />
              <div className="wash wash-anim top-28 left-4 size-40 bg-mint/70" />
            </div>
            <div className="relative flex h-full max-w-lg flex-col">
              <span aria-hidden className="grid size-12 place-items-center rounded-full bg-lake-blue text-[20px] text-parchment">◎</span>
              <h3 className="mt-8 text-[32px] sm:text-[44px]">Link &amp; kode promo sendiri</h3>
              <p className="mt-4 text-[16px] text-graphite">Setiap reseller punya link /r/kode dan kode promo sendiri. Pembeli dapat diskon, kamu dapat komisi.</p>
              <div className="mt-auto pt-8"><code className="rounded-full border border-navy/20 bg-parchment/70 px-4 py-2 text-[14px]">referral.syamxuanify.biz.id/r/<b className="font-medium text-lake-blue">KODEMU</b></code></div>
            </div>
          </Reveal>
          <Reveal className="card p-8 md:col-span-2" ><span aria-hidden className="text-[20px] text-lake-blue">↗</span><h3 className="mt-6 text-[24px]">Order lewat WhatsApp</h3><p className="mt-3 text-[15px] text-graphite">Kode pesanan #FD-XXXXXX ikut terkirim otomatis ke admin.</p></Reveal>
          <Reveal className="rounded-[24px] bg-navy p-8 text-parchment sm:rounded-[40px] md:col-span-2" ><span aria-hidden className="text-[20px] text-ice">▤</span><h3 className="mt-6 text-[24px]">Slip transparan</h3><p className="mt-3 text-[15px] text-frost/75">Komisi dicairkan dengan bukti transfer dan slip publik yang bisa dicek kapan saja.</p></Reveal>
          <Reveal className="card p-8 md:col-span-3" ><span aria-hidden className="text-[20px] text-lake-blue">◷</span><h3 className="mt-6 text-[24px]">Peringkat bulanan</h3><p className="mt-3 text-[15px] text-graphite">Leaderboard reseller tiap bulan, lengkap dengan jumlah order.</p></Reveal>
          <Reveal className="card p-8 md:col-span-3" ><span aria-hidden className="text-[20px] text-lake-blue">⚑</span><h3 className="mt-6 text-[24px]">Kampanye &amp; anti-curang</h3><p className="mt-3 text-[15px] text-graphite">Lacak kampanye lewat ?c= atau UTM; order mencurigakan ditandai untuk ditinjau admin.</p></Reveal>
        </div>
      </section>

      <section id="katalog" className="relative isolate scroll-mt-6 bg-frost/50 py-20 sm:py-28">
        <Washes className="opacity-60" />
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <Reveal>
            <p className="eyebrow">Katalog</p>
            <h2 className="mt-3 mb-10 text-[40px] sm:text-[56px]">Pilih produk</h2>
          </Reveal>
          <Suspense fallback={<p className="text-[14px] text-smoke">Memuat produk…</p>}>
            <Catalog />
          </Suspense>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-[1432px] px-4 py-20 sm:px-8">
        <Reveal><h2 className="text-[40px] sm:text-[56px]">Pertanyaan umum</h2></Reveal>
        <div className="mt-8">
          {FAQ.map((f) => (
            <details key={f.q} className="group border-b border-ash py-8 sm:py-10">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-serif text-[24px] leading-tight transition-colors hover:text-lake-blue [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full border border-ash font-mono text-[18px] transition-transform duration-300 group-open:rotate-180 group-open:border-lake-blue group-open:text-lake-blue">↓</span>
              </summary>
              <p className="mt-4 max-w-3xl text-[16px] text-graphite">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="bg-navy text-parchment">
        <div className="mx-auto flex max-w-[1432px] flex-col gap-8 px-4 py-16 sm:px-8 md:flex-row md:items-end">
          <div>
            <Logo light />
            <p className="mt-6 max-w-md font-serif text-[32px] leading-tight">Jualan produk digital, komisinya jelas.</p>
          </div>
          <div className="flex flex-col gap-3 md:ml-auto md:items-end">
            <Link href="/daftar" data-magnetic="" className="btn-light">Daftar reseller</Link>
            <span className="text-[12px] text-frost/60 uppercase">© PT Fusionify Digital Store</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
