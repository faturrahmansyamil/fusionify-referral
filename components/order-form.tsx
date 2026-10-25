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
          <label key={p.id} className={`card flex cursor-pointer items-start gap-3 p-4 transition ${productId === p.id ? "border-brand-500 ring-4 ring-brand-100" : "hover:border-slate-300"}`}>
            <input type="radio" name="productId" value={p.id} checked={productId === p.id} onChange={() => setProductId(p.id)} className="mt-1 accent-brand-600" />
            <span className="flex-1">
              <span className="block font-semibold">{p.name}</span>
              <span className="block text-sm text-slate-500">{p.description}</span>
            </span>
            <span className="font-bold text-brand-700 tabular-nums">{rupiah(p.price)}</span>
          </label>
        ))}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="label">Jumlah</span>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost size-11 p-0 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Kurangi">−</button>
            <input name="qty" type="number" min={1} max={50} value={qty} onChange={(e) => setQty(Math.min(50, Math.max(1, Number(e.target.value) || 1)))} className="input w-20 text-center" />
            <button type="button" className="btn-ghost size-11 p-0 text-lg" onClick={() => setQty((q) => Math.min(50, q + 1))} aria-label="Tambah">+</button>
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

      {state && !state.ok && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>}
      {state?.ok && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Pesanan <b>#{state.order.order_ref}</b> dibuat. Kalau WhatsApp tidak terbuka, <a className="font-semibold underline" href={state.waUrl}>klik di sini</a>.
        </p>
      )}

      <div className="sticky bottom-3 z-10">
        <div className="card flex items-center justify-between gap-3 p-3 pl-4 shadow-lg shadow-slate-900/5">
          <div>
            <p className="text-xs text-slate-500">Estimasi (sebelum promo)</p>
            <p className="text-lg font-bold tabular-nums">{rupiah((product?.price ?? 0) * qty)}</p>
          </div>
          <button disabled={pending} className="btn-wa px-5 py-3">{pending ? "Memproses…" : "Pesan via WhatsApp"}</button>
        </div>
      </div>
    </form>
  );
}
