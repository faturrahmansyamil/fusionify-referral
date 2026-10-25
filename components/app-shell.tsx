import { Logo, NavLink } from "./ui";
import { logout } from "@/app/login/actions";

export function AppShell({ links, email, home, children }: { links: [string, string][]; email: string; home: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 bg-parchment/85 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1432px] items-center gap-3 px-4 sm:px-8">
          <Logo href={home} />
          <form action={logout} className="ml-auto">
            <button className="btn-ghost min-h-10 px-5 py-2" title={email}>Keluar</button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-[1432px] gap-1 overflow-x-auto border-b border-ash px-2 pb-3 sm:px-6">
          {links.map(([href, label]) => <NavLink key={href} href={href}>{label}</NavLink>)}
        </nav>
      </header>
      <main className="mx-auto max-w-[1432px] px-4 py-10 sm:px-8">{children}</main>
    </div>
  );
}
