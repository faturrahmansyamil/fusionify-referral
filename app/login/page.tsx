"use client";
import Link from "next/link";
import { useActionState } from "react";
import { login } from "./actions";
import { AuthCard } from "@/components/auth-card";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <AuthCard title="Masuk" desc="Untuk reseller dan admin Fusionify.">
      <form action={action} className="grid gap-3">
        <input name="email" type="email" required placeholder="Email" autoComplete="email" className="input" />
        <input name="password" type="password" required placeholder="Password" autoComplete="current-password" className="input" />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button disabled={pending} className="btn-primary">Masuk</button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">Belum punya akun? <Link href="/daftar" className="font-medium text-brand-700">Daftar reseller</Link></p>
    </AuthCard>
  );
}
