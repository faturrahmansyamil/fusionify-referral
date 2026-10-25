import { Logo, Washes } from "./ui";
import { Reveal } from "./motion";

export function AuthCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <main className="relative isolate grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
      <Washes />
      <Reveal className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="card bg-parchment/80 p-8 backdrop-blur-sm sm:p-10">
          <h1 className="text-[40px]">{title}</h1>
          <p className="mt-2 mb-8 text-[14px] text-graphite">{desc}</p>
          {children}
        </div>
      </Reveal>
    </main>
  );
}
