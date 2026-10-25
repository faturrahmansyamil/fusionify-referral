import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tokenSchema } from "@/lib/validation";
import { Badge, Logo } from "@/components/ui";
import { rupiah, tanggal } from "@/lib/format";

export const metadata: Metadata = { title: "Slip komisi", robots: { index: false } };

type Slip = { reseller: string; total: number; status: string; created_at: string; paid_at: string | null; proof_url: string | null;
  items: { order_ref: string; product: string; order_total: number; amount: number; date: string }[] };

async function SlipView({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!tokenSchema.safeParse(token).success) notFound();
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_slip", { p_token: token });
  const s = data as Slip | null;
  if (!s) notFound();
  return (
    <article className="card overflow-hidden">
      <div className="bg-gradient-to-br from-brand-600 to-brand-900 p-6 text-white">
        <p className="text-xs tracking-widest text-brand-100 uppercase">Slip komisi reseller</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{rupiah(s.total)}</p>
        <p className="mt-1 text-sm text-brand-100">untuk {s.reseller} · dibuat {tanggal(s.created_at)}</p>
      </div>
      <div className="p-6">
        <div className="mb-4 flex items-center gap-2 text-sm"><Badge tone={s.status}>{s.status === "paid" ? "sudah ditransfer" : "menunggu transfer"}</Badge>
          {s.paid_at && <span className="text-slate-500">{tanggal(s.paid_at)}</span>}
          {s.proof_url && <a href={s.proof_url} target="_blank" rel="noopener noreferrer" className="ml-auto font-semibold text-brand-700">Bukti transfer →</a>}</div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500"><tr><th className="py-2">Order</th><th>Produk</th><th className="text-right">Total</th><th className="text-right">Komisi</th></tr></thead>
          <tbody>
            {s.items.map((i) => (
              <tr key={i.order_ref} className="border-t border-slate-100"><td className="py-2 font-mono text-xs">{i.order_ref}<div className="font-sans text-slate-400">{tanggal(i.date)}</div></td>
                <td>{i.product}</td><td className="text-right tabular-nums">{rupiah(i.order_total)}</td><td className="text-right font-semibold tabular-nums">{rupiah(i.amount)}</td></tr>
            ))}
          </tbody>
          <tfoot><tr className="border-t-2 border-slate-200"><td colSpan={3} className="py-2 font-semibold">Total</td><td className="text-right font-bold tabular-nums">{rupiah(s.total)}</td></tr></tfoot>
        </table>
        <p className="mt-4 text-xs text-slate-400">Slip ini dibuat otomatis dari data pesanan lunas. Data pembeli tidak ditampilkan.</p>
      </div>
    </article>
  );
}

export default function SlipPage({ params }: PageProps<"/slip/[token]">) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <div className="mb-5"><Logo /></div>
      <Suspense fallback={<p className="text-slate-400">Memuat…</p>}><SlipView params={params} /></Suspense>
    </main>
  );
}
