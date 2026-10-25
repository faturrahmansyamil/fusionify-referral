import Link from "next/link";
import Image from "next/image";

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 ${light ? "text-parchment" : "text-off-black"}`}>
      <Image src="/fusionify-seal.png" alt="" width={36} height={36} priority className="size-9" />
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
  pending: "bg-warn text-warn-ink border-transparent",
  approved: "bg-frost border-transparent",
  paid: "bg-ok text-ok-ink border-transparent",
  active: "bg-ok text-ok-ink border-transparent",
  void: "bg-transparent",
  cancelled: "bg-transparent",
  refunded: "bg-bad text-bad-ink border-transparent",
  banned: "bg-bad text-bad-ink border-transparent",
  draft: "bg-warn text-warn-ink border-transparent",
  flag: "bg-bad text-bad-ink border-transparent",
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

export function Mascot({ mood, size = 96, className = "" }: { mood: "empty" | "happy" | "confused"; size?: number; className?: string }) {
  // small, lazy, webp — official Fusionify mascot
  return <Image src={`/mascot/${mood}-420.webp`} alt="" width={size} height={size} loading="lazy" sizes={`${size}px`} className={`object-contain ${className}`} />;
}

export function Empty({ children, mascot = true }: { children: React.ReactNode; mascot?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[24px] border border-dashed border-ash p-6 text-center text-[14px] text-smoke">
      {mascot && <Mascot mood="empty" size={72} />}
      <p>{children}</p>
    </div>
  );
}

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="whitespace-nowrap rounded-full px-4 py-2 font-mono text-[14px] tracking-[-0.02em] text-off-black uppercase hover:bg-off-black/5">{children}</Link>;
}

export function Washes({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}>
      <div className="wash wash-anim orb-ice -top-32 -left-32 size-[26rem]" />
      <div className="wash wash-anim orb-light -right-40 -bottom-40 size-[26rem] opacity-20" />
    </div>
  );
}
