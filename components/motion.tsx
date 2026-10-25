// Server-safe reveal marker; GSAP (components/fx.tsx) animates [data-reveal] elements in batches.
export function Reveal({ children, className, delay = 0, as: Tag = "div" }: { children: React.ReactNode; className?: string; delay?: number; as?: "div" | "li" | "section" }) {
  return <Tag data-reveal="" data-delay={delay || undefined} className={className}>{children}</Tag>;
}
