"use client";
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Lightformer } from "@react-three/drei";
import { CatmullRomCurve3, Vector3, type Group } from "three";
import { heroScroll } from "@/lib/scroll-state";

// An "S" ribbon (nod to the Syamxuanify mark) built from a smooth curve.
function SForm() {
  const curve = useMemo(() => new CatmullRomCurve3([
    new Vector3(0.95, 1.25, 0), new Vector3(-0.15, 1.45, 0.25), new Vector3(-0.95, 0.85, 0),
    new Vector3(-0.35, 0.1, -0.2), new Vector3(0.55, -0.25, 0.1), new Vector3(0.95, -0.95, 0),
    new Vector3(0.1, -1.45, -0.25), new Vector3(-0.95, -1.2, 0),
  ]), []);
  return (
    <mesh>
      <tubeGeometry args={[curve, 220, 0.3, 40, false]} />
      <meshPhysicalMaterial color="#1e78d2" roughness={0.12} metalness={0.05} clearcoat={1} clearcoatRoughness={0.08} transmission={0.55} thickness={1.2} ior={1.4} attenuationColor="#155ea8" attenuationDistance={1.5} />
    </mesh>
  );
}

const ORBS = [
  { pos: [-1.9, 1.3, -0.8], r: 0.55, color: "#a9cdf2" },
  { pos: [1.9, 1.1, -1.2], r: 0.42, color: "#d9e8f8" },
  { pos: [1.6, -1.4, 0.4], r: 0.32, color: "#9ff0d8" },
  { pos: [-1.6, -1.5, 0.2], r: 0.36, color: "#1e78d2" },
] as const;

function Rig({ animate }: { animate: boolean }) {
  const ref = useRef<Group>(null);
  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    const p = heroScroll.progress;
    if (animate) g.rotation.y += delta * 0.12;
    // scroll-linked: tilt + push back as the hero scrolls away; pointer parallax on top
    const tx = state.pointer.y * 0.25 + p * 0.6;
    g.rotation.x += (tx - g.rotation.x) * 0.06;
    g.position.x += (state.pointer.x * 0.35 - g.position.x) * 0.05;
    state.camera.position.z += (6.6 + p * 3 - state.camera.position.z) * 0.08;
  });
  return (
    <group ref={ref}>
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}><SForm /></Float>
      {ORBS.map((o, i) => (
        <Float key={i} speed={1.4 + i * 0.2} floatIntensity={1.2}>
          <mesh position={o.pos as unknown as [number, number, number]}>
            {i % 2 ? <icosahedronGeometry args={[o.r, 0]} /> : <sphereGeometry args={[o.r, 48, 32]} />}
            <meshPhysicalMaterial color={o.color} roughness={0.15} clearcoat={1} transparent opacity={0.85} />
          </mesh>
        </Float>
      ))}
      <mesh position={[0, 0, -1.6]} rotation={[0.3, 0.2, 0]}>
        <torusGeometry args={[1.95, 0.035, 16, 160]} />
        <meshBasicMaterial color="#a9cdf2" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

export default function HeroScene({ animate = true, visible = true }: { animate?: boolean; visible?: boolean }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6.6], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={animate && visible ? "always" : "demand"} aria-hidden>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={2.4} />
      <directionalLight position={[-5, -2, 2]} intensity={1.2} color="#a9cdf2" />
      {/* local studio env baked once (no network HDR) for glassy reflections */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 3]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={2} color="#a9cdf2" position={[-5, 0, 2]} scale={[2, 6, 1]} />
        <Lightformer form="ring" intensity={2} color="#1e78d2" position={[4, -1, 3]} scale={2} />
      </Environment>
      <Rig animate={animate} />
    </Canvas>
  );
}
