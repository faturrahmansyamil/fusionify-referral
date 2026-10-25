import { FX } from "@/components/fx";

// template.tsx remounts on every navigation, so GSAP re-binds to each new page.
export default function Template({ children }: { children: React.ReactNode }) {
  return <FX>{children}</FX>;
}
