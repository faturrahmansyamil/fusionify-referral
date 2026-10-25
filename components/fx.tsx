"use client";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { heroScroll } from "@/lib/scroll-state";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const nf = new Intl.NumberFormat("id-ID");

/** One GSAP system for the whole app: reveals, counters, magnetic buttons, card tilt, hero scroll. */
export function FX({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP((_, contextSafe) => {
    const el = root.current!;
    const mm = gsap.matchMedia();
    const cleanups: (() => void)[] = [];

    mm.add({ motion: "(prefers-reduced-motion: no-preference)", fine: "(pointer: fine)" }, (ctx) => {
      const { motion, fine } = ctx.conditions as { motion: boolean; fine: boolean };
      const reveals = gsap.utils.toArray<HTMLElement>("[data-reveal]", el);
      const counters = gsap.utils.toArray<HTMLElement>("[data-count]", el);

      if (!motion) {
        reveals.forEach((r) => r.classList.add("is-in"));
        gsap.set(reveals, { clearProps: "all", opacity: 1, y: 0 });
        counters.forEach((c) => (c.textContent = nf.format(Number(c.dataset.count)) + (c.dataset.suffix ?? "")));
        return;
      }

      ScrollTrigger.batch(reveals, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => {
          batch.forEach((b) => b.classList.add("is-in"));
          gsap.fromTo(batch, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.08, overwrite: true,
            delay: Number((batch[0] as HTMLElement).dataset.delay ?? 0) });
        },
      });

      counters.forEach((c) => {
        const end = Number(c.dataset.count);
        const obj = { v: 0 };
        c.textContent = "0" + (c.dataset.suffix ?? "");
        gsap.to(obj, { v: end, duration: 1.6, ease: "power2.out",
          scrollTrigger: { trigger: c, start: "top 90%", once: true },
          onUpdate: () => { c.textContent = nf.format(Math.round(obj.v)) + (c.dataset.suffix ?? ""); } });
      });

      const hero = el.querySelector<HTMLElement>("[data-hero]");
      if (hero) {
        ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", scrub: true,
          onUpdate: (st) => { heroScroll.progress = st.progress; } });
        gsap.to(hero.querySelectorAll("[data-hero-copy]"), { y: -60, opacity: 0.2, ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 } });
      }

      if (!fine) return;
      gsap.utils.toArray<HTMLElement>("[data-magnetic]", el).forEach((m) => {
        const x = gsap.quickTo(m, "x", { duration: 0.4, ease: "power3" });
        const y = gsap.quickTo(m, "y", { duration: 0.4, ease: "power3" });
        const move = contextSafe!((e: PointerEvent) => {
          const r = m.getBoundingClientRect();
          x((e.clientX - r.left - r.width / 2) * 0.25); y((e.clientY - r.top - r.height / 2) * 0.35);
        });
        const leave = contextSafe!(() => { x(0); y(0); });
        m.addEventListener("pointermove", move); m.addEventListener("pointerleave", leave);
        cleanups.push(() => { m.removeEventListener("pointermove", move); m.removeEventListener("pointerleave", leave); });
      });
      gsap.utils.toArray<HTMLElement>("[data-tilt]", el).forEach((t) => {
        gsap.set(t, { transformPerspective: 900 });
        const rx = gsap.quickTo(t, "rotationX", { duration: 0.5, ease: "power3" });
        const ry = gsap.quickTo(t, "rotationY", { duration: 0.5, ease: "power3" });
        const move = contextSafe!((e: PointerEvent) => {
          const r = t.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 8); rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
        });
        const leave = contextSafe!(() => { rx(0); ry(0); });
        t.addEventListener("pointermove", move); t.addEventListener("pointerleave", leave);
        cleanups.push(() => { t.removeEventListener("pointermove", move); t.removeEventListener("pointerleave", leave); });
      });
    });

    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => { cleanups.forEach((f) => f()); mm.revert(); };
  }, { scope: root });

  return <div ref={root} className="contents">{children}</div>;
}
