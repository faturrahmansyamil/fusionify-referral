import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

async function Shell({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <AppShell home="/admin" email={user.email ?? ""} links={[["/admin", "Pesanan & Komisi"], ["/admin/reseller", "Reseller"], ["/admin/payout", "Pencairan"], ["/admin/produk", "Produk"], ["/admin/kampanye", "Kampanye"], ["/dashboard", "Dashboard saya"]]}>
      {children}
    </AppShell>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p className="p-6 text-slate-400">Memuat…</p>}><Shell>{children}</Shell></Suspense>;
}
