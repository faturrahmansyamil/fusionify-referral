import { Logo, NavLink } from "./ui";
import { logout } from "@/app/login/actions";

export function AppShell({ links, email, home, children }: { links: [string, string][]; email: string; home: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Logo href={home} />
          <form action={logout} className="ml-auto">
            <button className="text-xs text-slate-500 hover:text-rose-600" title={email}>Keluar</button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2">
          {links.map(([href, label]) => <NavLink key={href} href={href}>{label}</NavLink>)}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
