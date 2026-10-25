"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false, loading: () => null });

function StaticShapes() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute top-[18%] left-[14%] size-40 rounded-full border-[28px] border-coral/70 sm:size-56" />
      <div className="absolute top-[10%] right-[12%] size-36 rotate-12 rounded-[40px] bg-sky-blue/70 sm:size-48" />
      <div className="absolute bottom-[12%] left-[40%] size-32 rounded-full bg-mint/70 sm:size-44" />
      <div className="absolute bottom-[24%] left-[24%] size-24 -rotate-12 rounded-[24px] bg-gold/70 sm:size-32" />
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
  const [mode, setMode] = useState<"static" | "still" | "live">("static");
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const lowEnd = (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2 || nav.connection?.saveData;
    if (!canUseWebGL() || lowEnd) return;
    const id = window.setTimeout(() => setMode(reduce ? "still" : "live"), 150);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="absolute inset-0">
      {mode === "static" ? <StaticShapes /> : <HeroScene animate={mode === "live"} />}
    </div>
  );
}
