"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { easing } from "maath";
import { Path, Shape, type Group, type Mesh, type PointLight } from "three";
import { heroScroll } from "@/lib/scroll-state";

/* ---------- Fusionify seal, traced from the official 1024px seal artwork (px → world) ---------- */
const K = 1 / 200;
const X = (px: number) => (px - 512) * K;
const Y = (py: number) => -(py - 512) * K;
const BLUE = "#0d6cd7", DOT = "#539de9";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t: number) => (t <= 0 ? 0 : 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2));
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// 12-lobe scalloped outline
function wavy(r: number, amp: number, lobes = 12, n = 240, phase = 0.26) {
  const sh = new Shape();
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const rr = r * (1 + amp * Math.cos(lobes * t + phase));
    const x = Math.cos(t) * rr, y = Math.sin(t) * rr;
    if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y);
  }
  return sh;
}
function ring(r: number, w: number, amp: number) {
  const outer = wavy(r + w / 2, amp);
  const inner = wavy(r - w / 2, amp * ((r + w / 2) / (r - w / 2)));
  outer.holes.push(new Path(inner.getPoints().reverse()));
  return outer;
}
// rounded-end vertical pill (stems), top optionally square
function stem(x0: number, x1: number, yTop: number, yBot: number, roundTop: boolean) {
  const sh = new Shape();
  const r = (x1 - x0) / 2, cx = (x0 + x1) / 2;
  sh.moveTo(X(x0), Y(roundTop ? yTop + r : yTop));
  sh.lineTo(X(x0), Y(yBot - r));
  sh.absarc(X(cx), Y(yBot - r), r * K, Math.PI, 0, false);
  sh.lineTo(X(x1), Y(roundTop ? yTop + r : yTop));
  if (roundTop) sh.absarc(X(cx), Y(yTop + r), r * K, 0, Math.PI, false);
  else sh.lineTo(X(x0), Y(yTop));
  return sh;
}
// "F" with its rounded middle bar, as one outline (no overlapping seams)
function fGlyph() {
  const sh = new Shape();
  sh.moveTo(X(340), Y(285)); sh.lineTo(X(600), Y(285)); sh.lineTo(X(600), Y(400)); sh.lineTo(X(457), Y(400));
  sh.lineTo(X(457), Y(440)); sh.lineTo(X(590), Y(440));
  sh.absarc(X(590), Y(497.5), 57.5 * K, Math.PI / 2, -Math.PI / 2, true);
  sh.lineTo(X(457), Y(555)); sh.lineTo(X(457), Y(666.5));
  sh.absarc(X(398.5), Y(666.5), 58.5 * K, 0, -Math.PI, true);
  sh.lineTo(X(340), Y(285));
  return sh;
}

const GLYPH_DEPTH = 0.22;
const glyphExtrude = { depth: GLYPH_DEPTH, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.035, bevelSegments: 6, curveSegments: 32 };

function Seal({ animate }: { animate: boolean }) {
  const disc = useMemo(() => wavy(2.12, 0.035), []);
  const whiteRing = useMemo(() => ring(1.86, 0.11, 0.035), []);
  const parts = useMemo(() => ([
    { sh: fGlyph(), z: 0.02, color: "#ffffff" },
    { sh: stem(566, 709, 426, 739, true), z: 0.03, color: BLUE },   // the blue keyline around the "i"
    { sh: stem(580, 695, 440, 725, true), z: 0.045, color: "#ffffff" },
  ]), []);
  const group = useRef<Group>(null);
  const discM = useRef<Mesh>(null), ringM = useRef<Mesh>(null), dotM = useRef<Mesh>(null);
  const glyphs = useRef<(Mesh | null)[]>([]);
  const introT = useRef(0);

  useLayoutEffect(() => {
    if (!animate) return;
    discM.current?.scale.setScalar(0.001); ringM.current?.scale.setScalar(0.001); dotM.current?.scale.setScalar(0.001);
    glyphs.current.forEach((g) => { if (g) { g.visible = false; g.scale.set(1, 1, 0.001); } });
  }, [animate]);

  useFrame((_, dt) => {
    if (!animate || introT.current > 3) return;
    // clamped frame delta: a busy main thread at load can't skip the intro
    introT.current += Math.min(dt, 1 / 30);
    const t = introT.current;
    // 1) seal unfolds with a spin, 2) ring ripples out, 3) Fi extrudes piece by piece, 4) dot pops
    const pd = easeOutBack(clamp01((t - 0.1) / 0.9));
    discM.current?.scale.setScalar(Math.max(pd, 0.001));
    if (group.current) group.current.rotation.y = (1 - easeOutCubic(clamp01((t - 0.1) / 1.3))) * -Math.PI * 0.85;
    ringM.current?.scale.setScalar(Math.max(easeOutBack(clamp01((t - 0.55) / 0.7)), 0.001));
    glyphs.current.forEach((g, i) => {
      const p = easeInOutCubic(clamp01((t - 0.9 - (i === 0 ? 0 : 0.3)) / 0.6));
      if (g) { g.visible = p > 0.001; g.scale.set(1, 1, Math.max(p, 0.001)); }
    });
    dotM.current?.scale.setScalar(Math.max(easeOutBack(clamp01((t - 1.75) / 0.5)), 0.001));
  });

  return (
    <group ref={group}>
      <mesh ref={discM} position={[0, 0, -0.3]}>
        <extrudeGeometry args={[disc, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 6, curveSegments: 12 }]} />
        <meshPhysicalMaterial color={BLUE} roughness={0.16} metalness={0.05} clearcoat={1} clearcoatRoughness={0.06} envMapIntensity={1.2} />
      </mesh>
      <mesh ref={ringM} position={[0, 0, 0.02]}>
        <extrudeGeometry args={[whiteRing, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 3 }]} />
        <meshPhysicalMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.15} roughness={0.12} clearcoat={1} clearcoatRoughness={0.05} />
      </mesh>
      {parts.map((g, i) => (
        <mesh key={i} ref={(m) => { glyphs.current[i] = m; }} position={[0, 0, g.z]}>
          <extrudeGeometry args={[g.sh, glyphExtrude]} />
          <meshPhysicalMaterial color={g.color} emissive={g.color === BLUE ? "#000000" : "#ffffff"} emissiveIntensity={g.color === BLUE ? 0 : 0.18}
            roughness={0.06} clearcoat={1} clearcoatRoughness={0.03} envMapIntensity={1.3} />
        </mesh>
      ))}
      <mesh ref={dotM} position={[X(640), Y(335), 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[52 * K, 52 * K, 0.26, 64]} />
        <meshPhysicalMaterial color={DOT} roughness={0.1} clearcoat={1} clearcoatRoughness={0.04} />
      </mesh>
    </group>
  );
}

function Rig({ animate }: { animate: boolean }) {
  const outer = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const sweep = useRef<PointLight>(null);
  useFrame((state, dt) => {
    const o = outer.current, i = inner.current;
    if (!o || !i) return;
    const t = state.clock.elapsedTime;
    const p = heroScroll.progress;
    const d = Math.min(dt, 1 / 30); // clamp delta → no jumps after tab switch
    // spring-like (critically damped) pointer follow + scroll-linked spin
    easing.dampE(o.rotation, [
      -state.pointer.y * 0.28 + p * 0.5,
      state.pointer.x * 0.42 + p * Math.PI * 0.9,
      0,
    ], 0.35, d);
    easing.damp3(o.position, [state.pointer.x * 0.18, state.pointer.y * 0.12, -p * 1.5], 0.4, d);
    if (animate) {
      // idle breathing: slow float + gentle sway, sine-based so it loops seamlessly
      i.position.y = Math.sin(t * 0.8) * 0.08;
      i.rotation.z = Math.sin(t * 0.45) * 0.035;
      i.rotation.y = Math.sin(t * 0.3) * 0.12;
      const s = 1 + Math.sin(t * 0.8 + 1) * 0.012;
      i.scale.setScalar(s);
      // highlight sweep: a light glides across the face every ~5s
      if (sweep.current) {
        const k = (t % 5) / 5;
        sweep.current.position.set(-4 + easeInOutCubic(k) * 8, 1.5 - k * 3, 2.2);
        sweep.current.intensity = Math.sin(k * Math.PI) * 12;
      }
    }
  });
  return (
    <group ref={outer} rotation={[0, -0.18, 0]}>
      <group ref={inner} rotation={[0, 0, -0.05]}>
        <Seal animate={animate} />
      </group>
      <pointLight ref={sweep} color="#ffffff" intensity={0} distance={5} decay={2} />
    </group>
  );
}

export default function HeroScene({ animate = true, visible = true }: { animate?: boolean; visible?: boolean }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7.4], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={animate && visible ? "always" : "demand"} aria-hidden>
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <directionalLight position={[-4, -3, 2]} intensity={0.9} color="#a9cdf2" />
      {/* studio environment baked once (no network HDR): softboxes give clean glossy reflections */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={4} position={[0, 5, 2]} scale={[10, 2.5, 1]} />
        <Lightformer form="rect" intensity={2.5} color="#a9cdf2" position={[-6, 0, 3]} rotation-y={Math.PI / 2} scale={[3, 8, 1]} />
        <Lightformer form="rect" intensity={1.8} color="#d9e8f8" position={[6, 1, 2]} rotation-y={-Math.PI / 2} scale={[3, 6, 1]} />
        <Lightformer form="ring" intensity={3} color="#0d6cd7" position={[0, -4, 4]} scale={3} />
      </Environment>
      <Rig animate={animate} />
    </Canvas>
  );
}
