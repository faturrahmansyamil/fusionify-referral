import { Logo } from "./ui";

export function AuthCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(ellipse_at_top,var(--color-brand-100),transparent_60%)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="card p-6">
          <h1 className="text-lg font-bold">{title}</h1>
          <p className="mb-5 text-sm text-slate-500">{desc}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
