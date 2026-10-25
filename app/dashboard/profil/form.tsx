"use client";
import { useActionState } from "react";
import { saveProfile } from "./actions";
import type { Profile } from "@/lib/auth";

export function ProfileForm({ p }: { p: Profile }) {
  const [msg, action, pending] = useActionState(saveProfile, null);
  return (
    <form action={action} className="card grid max-w-lg gap-4 p-5">
      <label><span className="label">Nama lengkap</span><input name="fullName" defaultValue={p.full_name} required className="input" /></label>
      <label><span className="label">No. WhatsApp</span><input name="whatsapp" defaultValue={p.whatsapp ?? ""} required inputMode="tel" placeholder="08xxxxxxxxxx" className="input" /></label>
      <label><span className="label">Metode pencairan</span><input name="payoutMethod" defaultValue={p.payout_method ?? ""} required placeholder="DANA / BCA / GoPay" className="input" /></label>
      <label><span className="label">No. rekening / e-wallet</span><input name="payoutAccount" defaultValue={p.payout_account ?? ""} required className="input" /></label>
      <p className="text-xs text-slate-400">Hanya kamu dan admin yang bisa melihat data ini.</p>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <button disabled={pending} className="btn-primary">Simpan</button>
    </form>
  );
}
