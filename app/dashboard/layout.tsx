import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

async function Shell({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getSession();
  if (!profile) {
    return (
      <AppShell links={[]} email={user.email ?? ""} home="/dashboard">
        <div className="card p-6 text-sm text-slate-600">Akun ini tidak terdaftar di Fusionify Referral. Daftar lewat halaman <b>/daftar</b> atau minta admin menambahkan profilmu.</div>
      </AppShell>
    );
  }
  const links: [string, string][] = [["/dashboard", "Ringkasan"], ["/dashboard/profil", "Profil & Rekening"]];
  if (profile?.role === "admin") links.push(["/admin", "Panel Admin →"]);
  return (
    <AppShell links={links} email={user.email ?? ""} home="/dashboard">
      {profile?.status === "active" || profile?.role === "admin" ? children : (
        <div className="card p-6 text-sm text-slate-600">
          {profile?.status === "banned" ? "Akun ini dinonaktifkan." : "Akunmu sedang menunggu persetujuan admin. Sambil menunggu, lengkapi nomor WA & rekening di menu Profil."}
          {profile?.status === "pending" && <div className="mt-4">{children}</div>}
        </div>
      )}
    </AppShell>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p className="p-6 text-slate-400">Memuat…</p>}><Shell>{children}</Shell></Suspense>;
}
