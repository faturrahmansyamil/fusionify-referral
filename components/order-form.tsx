"use client";
import { useActionState, useEffect, useMemo, useState } from "react";
import { createOrder, type OrderResult } from "@/app/actions";
import { rupiah } from "@/lib/format";
import { Empty } from "./ui";
import { cleanName, isDemo, productMeta } from "@/lib/product-meta";

type Product = { id: string; name: string; description: string; price: number };

export function OrderForm({ products, refCode }: { products: Product[]; refCode: string | null }) {
  const [state, action, pending] = useActionState<OrderResult, FormData>(createOrder, null);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId]);

  useEffect(() => {
    if (state?.ok) window.location.href = state.waUrl;
  }, [state]);

  if (!products.length) return <Empty>Belum ada produk aktif.</Empty>;

  return (
    <form action={action} className="grid gap-5">
      <fieldset className="grid gap-2.5">
        <legend className="label">Pilih produk</legend>
        <div className="grid gap-3 sm:grid-cols-2">
        {products.map((p) => {
          const m = productMeta(p.name);
          const on = productId === p.id;
          return (
            <label key={p.id} data-tilt="" className={`group relative flex cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-lake-blue flex-col gap-4 overflow-hidden rounded-[24px] border p-6 transition-colors duration-200 ${on ? "border-lake-blue bg-frost" : "border-ash bg-parchment hover:border-navy"}`}>
              <input type="radio" name="productId" value={p.id} checked={on} onChange={() => setProductId(p.id)} className="sr-only" />
              <span className="flex items-start justify-between gap-3">
                <span aria-hidden className={`grid size-12 place-items-center rounded-full text-[20px] ${m.tone}`}>{m.icon}</span>
                <span className="flex flex-wrap justify-end gap-1.5">
                  <span className="rounded-full border border-ash px-2.5 py-0.5 text-[11px] uppercase">{m.tag}</span>
                  {isDemo(p.name) && <span className="rounded-full bg-navy px-2.5 py-0.5 text-[11px] text-parchment uppercase">Demo</span>}
                </span>
              </span>
              <span className="block font-serif text-[24px] leading-tight">{cleanName(p.name)}</span>
              <span className="block flex-1 text-[14px] text-graphite">{p.description}</span>
              <span className="flex items-center justify-between border-t border-ash pt-4">
                <span className="font-serif text-[28px] leading-none tabular-nums">{rupiah(p.price)}</span>
                <span aria-hidden className={`grid size-7 place-items-center rounded-full border text-[12px] transition ${on ? "border-lake-blue bg-lake-blue text-parchment" : "border-ash text-transparent group-hover:border-navy"}`}>✓</span>
              </span>
            </label>
          );
        })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="label">Jumlah</span>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost size-12 min-h-0 p-0 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Kurangi">−</button>
            <input name="qty" type="number" min={1} max={50} value={qty} onChange={(e) => setQty(Math.min(50, Math.max(1, Number(e.target.value) || 1)))} className="input w-20 text-center" />
            <button type="button" className="btn-ghost size-12 min-h-0 p-0 text-lg" onClick={() => setQty((q) => Math.min(50, q + 1))} aria-label="Tambah">+</button>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="promoCode">Kode promo (opsional)</label>
          <input id="promoCode" name="promoCode" maxLength={20} placeholder={refCode ? `Dari link: ${refCode}` : "contoh: RINA10"} className="input uppercase" />
        </div>
        <div>
          <label className="label" htmlFor="buyerName">Nama</label>
          <input id="buyerName" name="buyerName" required maxLength={80} autoComplete="name" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="buyerWa">No. WhatsApp</label>
          <input id="buyerWa" name="buyerWa" required inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" className="input" />
        </div>
      </div>

      {state && !state.ok && <p role="alert" className="rounded-[24px] bg-bad px-5 py-3 text-sm text-bad-ink">{state.error}</p>}
      {state?.ok && (
        <p className="rounded-[24px] bg-ok px-5 py-3 text-sm text-ok-ink">
          Pesanan <b>#{state.order.order_ref}</b> dibuat. Kalau WhatsApp tidak terbuka, <a className="font-medium underline" href={state.waUrl}>klik di sini</a>.
        </p>
      )}

      <div className="sticky bottom-3 z-10">
        <div className="flex items-center justify-between gap-3 rounded-full border border-ash bg-parchment/90 p-2 pl-6 backdrop-blur">
          <div>
            <p className="text-xs text-slate-500">Estimasi (sebelum promo)</p>
            <p className="font-serif text-[24px] leading-none tabular-nums">{rupiah((product?.price ?? 0) * qty)}</p>
          </div>
          <button disabled={pending} className="btn-wa px-6">{pending ? "Memproses…" : "Pesan via WhatsApp"}</button>
        </div>
      </div>
    </form>
  );
}
