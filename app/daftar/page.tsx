"use client";
import Link from "next/link";
import { useActionState } from "react";
import { signup } from "../login/actions";
import { AuthCard } from "@/components/auth-card";
import { Mascot } from "@/components/ui";

export default function DaftarPage() {
  const [msg, action, pending] = useActionState(signup, null);
  if (msg === "OK")
    return (
      <AuthCard title="Pendaftaran terkirim" desc="Cek email untuk konfirmasi (jika diaktifkan), lalu tunggu admin menyetujui akunmu dan membuatkan kode referral.">
        <div className="mb-6 flex justify-center"><Mascot mood="happy" size={120} /></div>
        <Link href="/login" className="btn-primary w-full">Ke halaman masuk</Link>
      </AuthCard>
    );
  return (
    <AuthCard title="Daftar reseller" desc="Dapatkan link + kode promo sendiri dan pantau komisimu.">
      <form action={action} className="grid gap-3">
        <input name="fullName" required maxLength={80} placeholder="Nama lengkap" autoComplete="name" className="input" />
        <input name="email" type="email" required placeholder="Email" autoComplete="email" className="input" />
        <input name="password" type="password" required minLength={8} placeholder="Password (min. 8)" autoComplete="new-password" className="input" />
        {msg && <p className="text-sm text-rose-600">{msg}</p>}
        <button disabled={pending} className="btn-primary">Daftar</button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">Sudah punya akun? <Link href="/login" className="font-medium text-brand-700">Masuk</Link></p>
    </AuthCard>
  );
}
