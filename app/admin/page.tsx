import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Badge, Empty, PageTitle, Stat } from "@/components/ui";
import { approveMatured, markPaid, reviewCommission, setOrderStatus } from "./actions";
import { rupiah, tanggal, FLAG_LABEL } from "@/lib/format";

type Order = { id: string; order_ref: string; qty: number; total: number; discount: number; buyer_name: string; buyer_wa: string; attribution: string; status: string; risk_flags: string[]; created_at: string; products: { name: string } | null; referral_codes: { code: string } | null };

async function Inner() {
  const { supabase } = await requireAdmin();
  const [{ data: orders }, { data: flagged }, { data: pend }] = await Promise.all([
    supabase.from("orders").select("id,order_ref,qty,total,discount,buyer_name,buyer_wa,attribution,status,risk_flags,created_at,products(name),referral_codes(code)").order("created_at", { ascending: false }).limit(100).returns<Order[]>(),
    supabase.from("commissions").select("id,order_ref,amount,risk_flags,hold_until").eq("status", "pending").neq("risk_flags", "{}"),
    supabase.from("commissions").select("amount").in("status", ["pending", "approved"]),
  ]);
  const paid = (orders ?? []).filter((o) => o.status === "paid");
  const viaRef = paid.filter((o) => o.attribution !== "none");
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Order menunggu bayar" value={String((orders ?? []).filter((o) => o.status === "pending").length)} />
        <Stat label="Omzet lunas (100 terakhir)" value={rupiah(paid.reduce((a, o) => a + o.total, 0))} />
        <Stat label="Lewat reseller" value={paid.length ? `${Math.round((viaRef.length / paid.length) * 100)}%` : "–"} />
        <Stat label="Komisi belum cair" value={rupiah((pend ?? []).reduce((a, c) => a + c.amount, 0))} />
      </div>

      <section className="card mt-6 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="flex-1 font-semibold">Review komisi bertanda risiko</h2>
          <ActionForm action={approveMatured} className="flex items-center gap-2"><button className="btn-ghost text-xs">Approve komisi lewat masa hold</button></ActionForm>
        </div>
        <ul className="mt-3 grid gap-2 text-sm">
          {(flagged ?? []).map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/40 px-3 py-2">
              <span className="font-mono text-xs">{c.order_ref}</span><b className="tabular-nums">{rupiah(c.amount)}</b>
              <span className="flex-1 text-xs text-rose-700">{c.risk_flags.map((f: string) => FLAG_LABEL[f] ?? f).join(", ")}</span>
              <ActionForm action={reviewCommission} className="flex items-center gap-2"><input type="hidden" name="id" value={c.id} /><input type="hidden" name="approve" value="1" /><button className="btn-ghost px-2 py-1 text-xs">Setujui</button></ActionForm>
              <ActionForm action={reviewCommission} confirm="Batalkan komisi ini?" className="flex items-center gap-2"><input type="hidden" name="id" value={c.id} /><input type="hidden" name="approve" value="0" /><button className="btn-ghost px-2 py-1 text-xs text-rose-600">Tolak</button></ActionForm>
            </li>
          ))}
          {!flagged?.length && <Empty>Tidak ada komisi mencurigakan.</Empty>}
        </ul>
      </section>

      <section className="card mt-6 overflow-hidden">
        <h2 className="px-5 pt-5 font-semibold">Pesanan</h2>
        <p className="px-5 text-xs text-slate-400">Cocokkan kode <code>#FD-…</code> di chat WA, lalu tandai lunas setelah pembayaran masuk.</p>
        <div className="overflow-x-auto">
          <table className="mt-3 w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-5 py-2">Kode</th><th>Pembeli</th><th>Produk</th><th>Total</th><th>Atribusi</th><th>Status</th><th className="pr-5">Aksi</th></tr></thead>
            <tbody>
              {(orders ?? []).map((o) => (
                <tr key={o.id} className="border-t border-slate-100 align-top">
                  <td className="px-5 py-2.5 font-mono text-xs">{o.order_ref}<div className="font-sans text-slate-400">{tanggal(o.created_at)}</div></td>
                  <td>{o.buyer_name}<div className="text-xs"><a className="text-brand-700" href={`https://wa.me/${o.buyer_wa}`} target="_blank" rel="noopener noreferrer">{o.buyer_wa}</a></div></td>
                  <td>{o.products?.name} ×{o.qty}</td>
                  <td className="tabular-nums">{rupiah(o.total)}{o.discount > 0 && <div className="text-xs text-slate-400">diskon {rupiah(o.discount)}</div>}</td>
                  <td>{o.referral_codes ? <><b>{o.referral_codes.code}</b><div className="text-xs text-slate-400">{o.attribution}</div></> : <span className="text-slate-400">–</span>}
                    {o.risk_flags.length > 0 && <div className="mt-1"><Badge tone="flag">risiko</Badge></div>}</td>
                  <td><Badge tone={o.status}>{o.status}</Badge></td>
                  <td className="pr-5">
                    {o.status === "pending" && (
                      <div className="flex flex-wrap gap-1.5">
                        <ActionForm action={markPaid} confirm={`Tandai ${o.order_ref} lunas?`} className="flex items-center gap-1"><input type="hidden" name="id" value={o.id} /><button className="btn-primary px-2.5 py-1 text-xs">Lunas</button></ActionForm>
                        <ActionForm action={setOrderStatus} confirm="Batalkan pesanan?" className="flex items-center gap-1"><input type="hidden" name="id" value={o.id} /><input type="hidden" name="status" value="cancelled" /><button className="btn-ghost px-2.5 py-1 text-xs">Batal</button></ActionForm>
                      </div>
                    )}
                    {o.status === "paid" && <ActionForm action={setOrderStatus} confirm="Refund? Komisi yang belum cair akan dibatalkan." className="flex items-center gap-1"><input type="hidden" name="id" value={o.id} /><input type="hidden" name="status" value="refunded" /><button className="btn-ghost px-2.5 py-1 text-xs text-rose-600">Refund</button></ActionForm>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!orders?.length && <div className="p-5"><Empty>Belum ada pesanan.</Empty></div>}
        </div>
      </section>
    </>
  );
}

export default function AdminPage() {
  return (
    <>
      <PageTitle title="Pesanan & Komisi" desc="Komisi dibuat saat pesanan ditandai lunas, ditahan 7 hari, lalu siap dicairkan." />
      <Suspense fallback={<p className="text-slate-400">Memuat…</p>}><Inner /></Suspense>
    </>
  );
}
