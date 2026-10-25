"use client";
import { useActionState, useEffect, useMemo, useState } from "react";
import { createOrder, type OrderResult } from "@/app/actions";
import { rupiah } from "@/lib/format";

type Product = { id: string; name: string; description: string; price: number };

export function OrderForm({ products, refCode }: { products: Product[]; refCode: string | null }) {
  const [state, action, pending] = useActionState<OrderResult, FormData>(createOrder, null);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId]);

  useEffect(() => {
    if (state?.ok) window.location.href = state.waUrl;
  }, [state]);

  if (!products.length) return <p className="text-sm text-slate-500">Belum ada produk aktif.</p>;

  return (
    <form action={action} className="grid gap-5">
      <fieldset className="grid gap-2.5">
        <legend className="label">Pilih produk</legend>
        {products.map((p) => (
          <label key={p.id} className={`flex cursor-pointer items-start gap-4 rounded-[24px] border p-5 transition duration-200 sm:p-6 ${productId === p.id ? "border-off-black bg-periwinkle-mist" : "border-ash hover:border-off-black"}`}>
            <input type="radio" name="productId" value={p.id} checked={productId === p.id} onChange={() => setProductId(p.id)} className="mt-1 accent-off-black" />
            <span className="flex-1">
              <span className="block font-serif text-[24px] leading-tight">{p.name}</span>
              <span className="block text-sm text-slate-500">{p.description}</span>
            </span>
            <span className="font-medium tabular-nums">{rupiah(p.price)}</span>
          </label>
        ))}
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

      {state && !state.ok && <p role="alert" className="rounded-[24px] bg-coral/25 px-5 py-3 text-sm text-off-black">{state.error}</p>}
      {state?.ok && (
        <p className="rounded-[24px] bg-mint/50 px-5 py-3 text-sm text-off-black">
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
