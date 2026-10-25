import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Badge, Empty, PageTitle } from "@/components/ui";
import { createPayout, markPayoutPaid } from "../actions";
import { rupiah, tanggal } from "@/lib/format";

async function Inner() {
  const { supabase } = await requireAdmin();
  const [{ data: ready }, { data: payouts }, { data: people }] = await Promise.all([
    supabase.from("commissions").select("reseller_id,amount").eq("status", "approved").is("payout_id", null),
    supabase.from("payouts").select("id,reseller_id,total,status,slip_token,created_at,proof_url").order("created_at", { ascending: false }).limit(50),
    supabase.from("profiles").select("id,full_name,payout_method,payout_account").eq("role", "reseller"),
  ]);
  const who = new Map((people ?? []).map((p) => [p.id, p]));
  const totals = new Map<string, number>();
  for (const c of ready ?? []) totals.set(c.reseller_id, (totals.get(c.reseller_id) ?? 0) + c.amount);
  return (
    <>
      <section className="card p-5">
        <h2 className="text-[24px]">Siap dicairkan</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {[...totals].map(([rid, total]) => (
            <li key={rid} className="flex flex-wrap items-center gap-3 rounded-[20px] border border-slate-100 px-3 py-2">
              <span className="flex-1"><b>{who.get(rid)?.full_name}</b> <span className="text-xs text-slate-500">{who.get(rid)?.payout_method} {who.get(rid)?.payout_account}</span></span>
              <b className="tabular-nums">{rupiah(total)}</b>
              <ActionForm action={createPayout} className="flex items-center gap-2"><input type="hidden" name="resellerId" value={rid} /><button className="btn-primary min-h-8 px-3 py-1.5 text-xs">Buat payout</button></ActionForm>
            </li>
          ))}
          {!totals.size && <Empty>Tidak ada komisi approved yang belum dicairkan.</Empty>}
        </ul>
      </section>
      <section className="card mt-6 p-5">
        <h2 className="text-[24px]">Riwayat payout</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {(payouts ?? []).map((p) => (
            <li key={p.id} className="grid gap-2 rounded-[20px] border border-slate-100 px-3 py-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex-1">{who.get(p.reseller_id)?.full_name} · {tanggal(p.created_at)}</span>
                <b className="tabular-nums">{rupiah(p.total)}</b><Badge tone={p.status}>{p.status}</Badge>
                <Link href={`/slip/${p.slip_token}`} className="text-xs font-medium text-brand-700">Slip →</Link>
              </div>
              {p.status === "draft" && (
                <ActionForm action={markPayoutPaid} confirm="Sudah transfer manual?" className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="proofUrl" type="url" required placeholder="https://… link bukti transfer" className="input flex-1 py-1.5" />
                  <button className="btn-ghost min-h-8 px-3 py-1.5 text-xs">Tandai dibayar</button>
                </ActionForm>
              )}
            </li>
          ))}
          {!payouts?.length && <Empty>Belum ada payout.</Empty>}
        </ul>
      </section>
    </>
  );
}

export default function PayoutPage() {
  return (<><PageTitle title="Pencairan" desc="Transfer manual ke rekening/e-wallet reseller, lalu simpan link bukti. Slip otomatis bisa dibuka reseller." /><Suspense fallback={<p className="text-slate-400">Memuat…</p>}><Inner /></Suspense></>);
}
