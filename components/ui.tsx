import Link from "next/link";
import Image from "next/image";

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 ${light ? "text-parchment" : "text-off-black"}`}>
      <Image src="/logo-bulat.png" alt="" width={32} height={32} priority className="size-8 rounded-full" />
      <span className="font-serif text-[24px] leading-none tracking-[-0.02em]">fusionify<span className={light ? "text-ice" : "text-lake-blue"}> referral</span></span>
    </Link>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5 sm:p-6">
      <p className="eyebrow">{label}</p>
      <p className="mt-3 font-serif text-[28px] leading-none tabular-nums sm:text-[32px]">{value}</p>
      {hint && <p className="mt-2 text-[12px] text-smoke">{hint}</p>}
    </div>
  );
}

const TONE: Record<string, string> = {
  pending: "bg-gold/50",
  approved: "bg-periwinkle-mist",
  paid: "bg-mint/60",
  active: "bg-mint/60",
  void: "bg-transparent",
  cancelled: "bg-transparent",
  refunded: "bg-coral/30",
  banned: "bg-coral/30",
  draft: "bg-gold/50",
  flag: "bg-coral/30",
};

export function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`inline-flex rounded-full border border-ash px-2.5 py-0.5 font-mono text-[12px] tracking-[-0.033em] text-off-black uppercase ${TONE[tone] ?? TONE.void}`}>{children}</span>;
}

export function PageTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-[40px] sm:text-[48px]">{title}</h1>
      {desc && <p className="mt-2 text-[16px] text-graphite">{desc}</p>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[24px] border border-dashed border-ash p-6 text-center text-[14px] text-smoke">{children}</p>;
}

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="whitespace-nowrap rounded-full px-4 py-2 font-mono text-[14px] tracking-[-0.02em] text-off-black uppercase hover:bg-off-black/5">{children}</Link>;
}

export function Washes({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute -inset-x-40 -top-20 -bottom-40 -z-10 ${className}`}>
      <div className="wash wash-anim -top-24 -left-24 h-80 w-96 bg-sky-blue/70" />
      <div className="wash wash-anim top-10 right-[-6rem] h-96 w-[28rem] bg-ice/80" />
      <div className="wash wash-anim bottom-[-8rem] left-1/3 h-80 w-96 bg-mint/50" />
    </div>
  );
}
