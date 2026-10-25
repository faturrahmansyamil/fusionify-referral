import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { PageTitle } from "@/components/ui";
import { ProfileForm } from "./form";

async function Inner() {
  const { profile } = await getSession();
  return profile ? <ProfileForm p={profile} /> : null;
}

export default function ProfilPage() {
  return (
    <>
      <PageTitle title="Profil & Rekening" desc="Nomor WA dipakai untuk deteksi beli-pakai-kode-sendiri; rekening untuk pencairan." />
      <Suspense fallback={<p className="text-slate-400">Memuat…</p>}><Inner /></Suspense>
    </>
  );
}
