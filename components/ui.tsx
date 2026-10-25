import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-bold tracking-tight">
      <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm text-white shadow-sm">F</span>
      <span>Fusionify<span className="text-brand-600"> Referral</span></span>
    </Link>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const TONE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-sky-50 text-sky-700 ring-sky-200",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  void: "bg-slate-100 text-slate-500 ring-slate-200",
  cancelled: "bg-slate-100 text-slate-500 ring-slate-200",
  refunded: "bg-rose-50 text-rose-700 ring-rose-200",
  banned: "bg-rose-50 text-rose-700 ring-rose-200",
  draft: "bg-amber-50 text-amber-700 ring-amber-200",
  flag: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${TONE[tone] ?? TONE.void}`}>{children}</span>;
}

export function PageTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
      {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">{children}</p>;
}

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700">{children}</Link>;
}
