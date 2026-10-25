"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false, loading: () => null });

function StaticShapes() {
  // no-WebGL / low-end / pre-hydration: the real logo mark, same footprint as the 3D (no layout shift)
  return (
    <div aria-hidden className="absolute inset-0 grid place-items-center">
      <div className="wash orb-blue size-72 sm:size-96" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/fusionify-seal.png" alt="" width={256} height={256} className="relative size-56 drop-shadow-[0_30px_60px_color-mix(in_srgb,var(--color-lake-blue)_55%,transparent)] sm:size-72" />
    </div>
  );
}

function canUseWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

export function Hero3D() {
  const [mode, setMode] = useState<"pending" | "static" | "still" | "live">("pending");
  const [visible, setVisible] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  // Pause the render loop when the hero is off-screen or the tab is hidden.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let inView = true;
    const sync = () => setVisible(inView && !document.hidden);
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, []);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const lowEnd = (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2 || nav.connection?.saveData;
    if (!canUseWebGL() || lowEnd) { const f = window.setTimeout(() => setMode("static"), 0); return () => clearTimeout(f); }
    const id = window.setTimeout(() => setMode(reduce ? "still" : "live"), 150);
    return () => clearTimeout(id);
  }, []);
  return (
    <div ref={box} className="absolute inset-0">
      {mode === "static" ? <StaticShapes /> : mode === "pending" ? null : <HeroScene animate={mode === "live"} visible={visible} />}
    </div>
  );
}
