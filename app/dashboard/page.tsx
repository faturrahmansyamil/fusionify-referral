import { Suspense } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { getSession } from "@/lib/auth";
import { Badge, Empty, PageTitle, Stat } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";
import { rupiah, startOfMonthWib, tanggal, FLAG_LABEL } from "@/lib/format";

type Commission = { id: string; order_ref: string; product_name: string; order_total: number; amount: number; status: string; hold_until: string; risk_flags: string[]; created_at: string };
type Payout = { id: string; total: number; status: string; slip_token: string; created_at: string; paid_at: string | null };

async function Overview() {
  const { supabase, profile } = await getSession();
  if (!profile || profile.status !== "active") return null;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const [{ data: codes }, { data: commissions }, { data: payouts }, { data: board }] = await Promise.all([
    supabase.from("referral_codes").select("id,code,discount_percent,active").eq("reseller_id", profile.id),
    supabase.from("commissions").select("*").eq("reseller_id", profile.id).order("created_at", { ascending: false }).limit(50).returns<Commission[]>(),
    supabase.from("payouts").select("id,total,status,slip_token,created_at,paid_at").eq("reseller_id", profile.id).order("created_at", { ascending: false }).returns<Payout[]>(),
    supabase.rpc("leaderboard", { p_from: startOfMonthWib() }),
  ]);
  const codeIds = (codes ?? []).map((c) => c.id);
  const { count: clicks } = codeIds.length
    ? await supabase.from("clicks").select("id", { count: "exact", head: true }).in("code_id", codeIds)
    : { count: 0 };
  const sum = (s: string) => (commissions ?? []).filter((c) => c.status === s).reduce((a, c) => a + c.amount, 0);
  const orders = (commissions ?? []).filter((c) => c.status !== "void").length;
  const main = codes?.find((c) => c.active);
  const link = main ? `${site}/r/${main.code}` : null;
  const qr = link ? await QRCode.toDataURL(link, { margin: 1, width: 360, color: { dark: "#172a5c" } }) : null;

  return (
    <>
      <PageTitle title={`Halo, ${profile.full_name.split(" ")[0] || "Reseller"} 👋`} desc="Pantau link, komisi, dan pencairanmu." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Klik link" value={String(clicks ?? 0)} />
        <Stat label="Order lunas" value={String(orders)} hint={clicks ? `konversi ${((orders / clicks) * 100).toFixed(1)}%` : undefined} />
        <Stat label="Komisi tertahan" value={rupiah(sum("pending"))} hint="masa hold 7 hari" />
        <Stat label="Siap dicairkan" value={rupiah(sum("approved"))} />
        <Stat label="Sudah dibayar" value={rupiah(sum("paid"))} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-semibold">Link & kode promo</h2>
          {main && link ? (
            <div className="mt-4 flex flex-col gap-5 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr!} alt={`QR ${main.code}`} className="size-36 rounded-xl border border-slate-200" />
              <div className="grid flex-1 content-start gap-3 text-sm">
                <div>
                  <p className="label">Link kamu</p>
                  <div className="flex items-center gap-2"><code className="truncate rounded-lg bg-slate-100 px-2 py-1">{link}</code><CopyButton text={link} /></div>
                </div>
                <div>
                  <p className="label">Kode promo</p>
                  <div className="flex items-center gap-2"><code className="rounded-lg bg-brand-50 px-2 py-1 font-bold text-brand-700">{main.code}</code>
                    <span className="text-slate-500">diskon {main.discount_percent}% untuk pembeli</span></div>
                </div>
                <p className="text-xs text-slate-400">Tambah <code>?c=nama-kampanye</code> di link untuk melacak kampanye (misal story IG vs grup WA).</p>
              </div>
            </div>
          ) : <Empty>Kode belum dibuat admin.</Empty>}
        </section>
        <section className="card p-5">
          <h2 className="font-semibold">Peringkat bulan ini</h2>
          <ol className="mt-3 grid gap-2 text-sm">
            {(board ?? []).map((r: { name: string; orders: number; commission: number }, i: number) => (
              <li key={i} className="flex items-center gap-3">
                <span className={`grid size-6 place-items-center rounded-full text-xs font-bold ${i < 3 ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span>
                <span className="flex-1">{r.name}</span><span className="text-slate-500">{r.orders} order</span>
              </li>
            ))}
            {!board?.length && <Empty>Belum ada data.</Empty>}
          </ol>
        </section>
      </div>

      <section className="card mt-6 overflow-hidden">
        <h2 className="px-5 pt-5 font-semibold">Riwayat komisi</h2>
        <div className="overflow-x-auto">
          <table className="mt-3 w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-5 py-2">Order</th><th>Produk</th><th>Total</th><th>Komisi</th><th className="pr-5">Status</th></tr></thead>
            <tbody>
              {(commissions ?? []).map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-5 py-2.5 font-mono text-xs">{c.order_ref}<div className="font-sans text-slate-400">{tanggal(c.created_at)}</div></td>
                  <td>{c.product_name}</td><td className="tabular-nums">{rupiah(c.order_total)}</td>
                  <td className="font-semibold tabular-nums">{rupiah(c.amount)}</td>
                  <td className="pr-5">
                    <Badge tone={c.status}>{c.status}</Badge>
                    {c.status === "pending" && <div className="text-xs text-slate-400">s/d {tanggal(c.hold_until)}</div>}
                    {c.risk_flags.map((f) => <div key={f} className="text-xs text-rose-600">{FLAG_LABEL[f] ?? f}</div>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!commissions?.length && <div className="p-5"><Empty>Belum ada komisi. Bagikan link-mu!</Empty></div>}
        </div>
      </section>

      <section className="card mt-6 p-5">
        <h2 className="font-semibold">Pencairan</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {(payouts ?? []).map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2">
              <span className="flex-1">{tanggal(p.created_at)} · <b className="tabular-nums">{rupiah(p.total)}</b></span>
              <Badge tone={p.status}>{p.status}</Badge>
              <Link href={`/slip/${p.slip_token}`} className="text-xs font-semibold text-brand-700">Lihat slip →</Link>
            </li>
          ))}
          {!payouts?.length && <Empty>Belum ada pencairan.</Empty>}
        </ul>
      </section>
    </>
  );
}

export default function DashboardPage() {
  return <Suspense fallback={<p className="text-slate-400">Memuat…</p>}><Overview /></Suspense>;
}
