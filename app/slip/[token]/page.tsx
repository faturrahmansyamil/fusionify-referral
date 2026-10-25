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
      <div className="relative overflow-hidden bg-periwinkle-mist p-8 sm:p-10"><div aria-hidden className="wash -top-10 -right-10 size-48 bg-coral/60" /><div aria-hidden className="wash -bottom-16 right-24 size-40 bg-mint/70" /><div className="relative">
        <p className="eyebrow text-graphite">Slip komisi reseller</p>
        <p className="mt-3 font-serif text-[48px] leading-none tabular-nums">{rupiah(s.total)}</p>
        <p className="mt-3 text-[14px] text-graphite">untuk {s.reseller} · dibuat {tanggal(s.created_at)}</p>
      </div></div>
      <div className="p-6 sm:p-10">
        <div className="mb-4 flex items-center gap-2 text-sm"><Badge tone={s.status}>{s.status === "paid" ? "sudah ditransfer" : "menunggu transfer"}</Badge>
          {s.paid_at && <span className="text-slate-500">{tanggal(s.paid_at)}</span>}
          {s.proof_url && <a href={s.proof_url} target="_blank" rel="noopener noreferrer" className="ml-auto font-medium text-brand-700">Bukti transfer →</a>}</div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500"><tr><th className="py-2">Order</th><th>Produk</th><th className="text-right">Total</th><th className="text-right">Komisi</th></tr></thead>
          <tbody>
            {s.items.map((i) => (
              <tr key={i.order_ref} className="border-t border-slate-100"><td className="py-2 font-mono text-xs">{i.order_ref}<div className="text-slate-400">{tanggal(i.date)}</div></td>
                <td>{i.product}</td><td className="text-right tabular-nums">{rupiah(i.order_total)}</td><td className="text-right font-medium tabular-nums">{rupiah(i.amount)}</td></tr>
            ))}
          </tbody>
          <tfoot><tr className="border-t-2 border-slate-200"><td colSpan={3} className="py-2 font-medium">Total</td><td className="text-right font-medium tabular-nums">{rupiah(s.total)}</td></tr></tfoot>
        </table>
        <p className="mt-4 text-xs text-slate-400">Slip ini dibuat otomatis dari data pesanan lunas. Data pembeli tidak ditampilkan.</p>
      </div>
    </article>
  );
}

export default function SlipPage({ params }: PageProps<"/slip/[token]">) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-5"><Logo /></div>
      <Suspense fallback={<p className="text-slate-400">Memuat…</p>}><SlipView params={params} /></Suspense>
    </main>
  );
}
