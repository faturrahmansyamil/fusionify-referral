"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import type { Group } from "three";

const SHAPES = [
  { kind: "torus", color: "#ff9473", pos: [-1.3, 0.5, 0], scale: 1.05 },
  { kind: "ico", color: "#a0b5eb", pos: [1.2, 0.7, -0.6], scale: 1.15 },
  { kind: "sphere", color: "#a7fccd", pos: [0.25, -0.9, 0.4], scale: 0.95 },
  { kind: "box", color: "#ecda98", pos: [-0.2, 0.15, -1.2], scale: 0.95 },
  { kind: "cone", color: "#2b59d1", pos: [1.6, -0.8, 0.2], scale: 0.5 },
] as const;

function Shape({ kind, color, pos, scale, i }: (typeof SHAPES)[number] & { i: number }) {
  return (
    <Float speed={1 + i * 0.15} rotationIntensity={0.6} floatIntensity={0.8}>
      <mesh position={pos as unknown as [number, number, number]} scale={scale} rotation={[i * 0.6, i * 0.9, 0]}>
        {kind === "torus" && <torusGeometry args={[0.75, 0.3, 32, 96]} />}
        {kind === "ico" && <icosahedronGeometry args={[0.85, 0]} />}
        {kind === "sphere" && <sphereGeometry args={[0.7, 48, 32]} />}
        {kind === "box" && <boxGeometry args={[1, 1, 1]} />}
        {kind === "cone" && <coneGeometry args={[0.7, 1.3, 48]} />}
        <meshPhysicalMaterial color={color} transparent opacity={0.72} roughness={0.25} transmission={0.35} thickness={0.6} clearcoat={1} depthWrite={false} />
      </mesh>
    </Float>
  );
}

function Rig({ animate }: { animate: boolean }) {
  const ref = useRef<Group>(null);
  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    if (animate) g.rotation.y += delta * 0.08;
    const tx = state.pointer.y * 0.25;
    const ty = state.pointer.x * 0.35;
    g.rotation.x += (tx - g.rotation.x) * 0.05;
    g.position.x += (ty * 0.4 - g.position.x) * 0.05;
  });
  return (
    <group ref={ref}>
      {SHAPES.map((s, i) => <Shape key={i} {...s} i={i} />)}
    </group>
  );
}

export default function HeroScene({ animate = true }: { animate?: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 5.2], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      frameloop={animate ? "always" : "demand"}
      aria-hidden
    >
      <ambientLight intensity={1.4} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <directionalLight position={[-4, -2, 2]} intensity={0.8} color="#cfdaf5" />
      <Rig animate={animate} />
    </Canvas>
  );
}
