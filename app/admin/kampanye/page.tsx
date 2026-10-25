import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Empty, PageTitle } from "@/components/ui";
import { saveCampaign } from "../actions";
import { rupiah } from "@/lib/format";

async function Inner() {
  const { supabase } = await requireAdmin();
  const [{ data: camps }, { data: clicks }, { data: orders }] = await Promise.all([
    supabase.from("campaigns").select("id,name,slug,utm_source,utm_medium").order("created_at", { ascending: false }),
    supabase.from("clicks").select("campaign_id").not("campaign_id", "is", null).limit(10000),
    supabase.from("orders").select("campaign_id,total,status").not("campaign_id", "is", null).limit(10000),
  ]);
  if (!camps?.length) return <Empty>Belum ada kampanye.</Empty>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-5 py-2">Kampanye</th><th>Klik</th><th>Order</th><th>Lunas</th><th className="pr-5">Omzet lunas</th></tr></thead>
        <tbody>
          {camps.map((c) => {
            const os = (orders ?? []).filter((o) => o.campaign_id === c.id);
            const paid = os.filter((o) => o.status === "paid");
            return (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-5 py-2.5"><b>{c.name}</b><div className="font-mono text-xs text-slate-400">?c={c.slug} {c.utm_source && `· ${c.utm_source}/${c.utm_medium ?? "-"}`}</div></td>
                <td className="tabular-nums">{(clicks ?? []).filter((k) => k.campaign_id === c.id).length}</td>
                <td className="tabular-nums">{os.length}</td><td className="tabular-nums">{paid.length}</td>
                <td className="pr-5 tabular-nums">{rupiah(paid.reduce((a, o) => a + o.total, 0))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function KampanyePage() {
  return (
    <>
      <PageTitle title="Kampanye" desc="Reseller menambahkan ?c=slug (atau utm_campaign=slug) di link-nya. Klik & order tercatat per kampanye." />
      <ActionForm action={saveCampaign} className="card mb-6 grid gap-3 p-5 sm:grid-cols-4">
        <input name="name" required placeholder="Nama (Story IG Nov)" className="input sm:col-span-2" />
        <input name="slug" required placeholder="slug: ig-nov" className="input" />
        <input name="utmSource" placeholder="utm_source" className="input" />
        <input name="utmMedium" placeholder="utm_medium" className="input" />
        <button className="btn-primary sm:col-span-3">Buat kampanye</button>
      </ActionForm>
      <Suspense fallback={<p className="text-slate-400">Memuat…</p>}><Inner /></Suspense>
    </>
  );
}
