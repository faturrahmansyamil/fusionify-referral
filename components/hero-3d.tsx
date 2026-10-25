"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false, loading: () => null });

function StaticShapes() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute top-1/2 left-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-lake-blue to-lake-deep opacity-80 blur-[2px] sm:size-80" />
      <div className="absolute top-[18%] left-[18%] size-20 rounded-full bg-ice/80 sm:size-28" />
      <div className="absolute right-[16%] bottom-[18%] size-16 rounded-full bg-mint/70 sm:size-24" />
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
    if (!canUseWebGL() || lowEnd) return;
    const id = window.setTimeout(() => setMode(reduce ? "still" : "live"), 150);
    return () => clearTimeout(id);
  }, []);
  return (
    <div ref={box} className="absolute inset-0">
      {mode === "static" ? <StaticShapes /> : <HeroScene animate={mode === "live"} visible={visible} />}
    </div>
  );
}
