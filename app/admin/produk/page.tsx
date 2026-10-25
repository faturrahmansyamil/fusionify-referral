import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Badge, PageTitle } from "@/components/ui";
import { saveProduct, toggleProduct } from "../actions";
import { rupiah } from "@/lib/format";

async function Inner() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("products").select("*").order("sort");
  return (
    <ul className="grid gap-2">
      {(data ?? []).map((p) => (
        <li key={p.id} className="card flex flex-wrap items-center gap-3 p-4 text-sm">
          <div className="flex-1"><b>{p.name}</b><div className="text-xs text-slate-500">{rupiah(p.price)} · komisi {p.commission_type === "percent" ? `${p.commission_value}%` : `${rupiah(p.commission_value)}/item`}</div></div>
          <Badge tone={p.active ? "active" : "void"}>{p.active ? "aktif" : "nonaktif"}</Badge>
          <ActionForm action={toggleProduct} className="flex items-center gap-2"><input type="hidden" name="id" value={p.id} /><input type="hidden" name="active" value={String(!p.active)} /><button className="btn-ghost min-h-8 px-3 py-1.5 text-xs">{p.active ? "Nonaktifkan" : "Aktifkan"}</button></ActionForm>
        </li>
      ))}
    </ul>
  );
}

export default function ProdukPage() {
  return (
    <>
      <PageTitle title="Produk" desc="Atur harga dan aturan komisi per produk (persen dari total setelah diskon, atau flat per item)." />
      <ActionForm action={saveProduct} className="card mb-6 grid gap-3 p-5 sm:grid-cols-2">
        <input name="name" required placeholder="Nama produk" className="input" />
        <input name="price" type="number" min={1} required placeholder="Harga (Rp)" className="input" />
        <input name="description" placeholder="Deskripsi singkat" className="input sm:col-span-2" />
        <select name="commissionType" className="input"><option value="percent">Komisi persen</option><option value="flat">Komisi flat / item</option></select>
        <input name="commissionValue" type="number" min={0} required placeholder="Nilai komisi" className="input" />
        <button className="btn-primary sm:col-span-2">Tambah produk</button>
      </ActionForm>
      <Suspense fallback={<p className="text-slate-400">Memuat…</p>}><Inner /></Suspense>
    </>
  );
}
