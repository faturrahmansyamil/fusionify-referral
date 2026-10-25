import { Suspense } from "react";
import { requireAdmin, type Profile } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Badge, Empty, PageTitle } from "@/components/ui";
import { createCode, setResellerStatus } from "../actions";

async function Inner() {
  const { supabase } = await requireAdmin();
  const [{ data: people }, { data: codes }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "reseller").order("created_at", { ascending: false }).returns<Profile[]>(),
    supabase.from("referral_codes").select("reseller_id,code,discount_percent,active"),
  ]);
  if (!people?.length) return <Empty>Belum ada reseller yang daftar.</Empty>;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {people.map((p) => (
        <div key={p.id} className="card grid gap-3 p-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="flex-1"><b>{p.full_name || "(tanpa nama)"}</b><div className="text-xs text-slate-500">{p.email} · {p.whatsapp ?? "WA belum diisi"}</div>
              <div className="text-xs text-slate-400">Pencairan: {p.payout_method ?? "–"} {p.payout_account ?? ""}</div></div>
            <Badge tone={p.status}>{p.status}</Badge>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(codes ?? []).filter((c) => c.reseller_id === p.id).map((c) => <code key={c.code} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{c.code} · {c.discount_percent}%</code>)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {p.status !== "active" && <ActionForm action={setResellerStatus} className="flex items-center gap-2"><input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value="active" /><button className="btn-primary min-h-8 px-3 py-1.5 text-xs">Setujui</button></ActionForm>}
            {p.status !== "banned" && <ActionForm action={setResellerStatus} confirm="Nonaktifkan reseller ini?" className="flex items-center gap-2"><input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value="banned" /><button className="btn-ghost min-h-8 px-3 py-1.5 text-xs text-bad-ink">Nonaktifkan</button></ActionForm>}
          </div>
          <ActionForm action={createCode} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="resellerId" value={p.id} />
            <input name="code" required placeholder="KODE" maxLength={20} className="input w-28 py-1.5 uppercase" />
            <input name="discount" type="number" min={0} max={50} defaultValue={5} className="input w-20 py-1.5" aria-label="Diskon %" />
            <span className="text-xs text-slate-400">% diskon</span>
            <button className="btn-ghost min-h-8 px-3 py-1.5 text-xs">Buat kode</button>
          </ActionForm>
        </div>
      ))}
    </div>
  );
}

export default function ResellerPage() {
  return (<><PageTitle title="Reseller" desc="Setujui pendaftar baru dan buatkan kode promo/link." /><Suspense fallback={<p className="text-slate-400">Memuat…</p>}><Inner /></Suspense></>);
}
