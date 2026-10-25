"use client";
import { useActionState } from "react";
import type { Msg } from "@/app/admin/actions";

/** Form kecil untuk server action admin, menampilkan hasil/galat di sebelahnya. */
export function ActionForm({ action, children, className = "", confirm }: {
  action: (prev: Msg, fd: FormData) => Promise<Msg>; children: React.ReactNode; className?: string; confirm?: string;
}) {
  const [msg, run, pending] = useActionState(action, null);
  return (
    <form action={run} className={className} onSubmit={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}>
      <fieldset disabled={pending} className="contents">{children}</fieldset>
      {msg && <span className={`text-xs ${msg.startsWith("Gagal") ? "text-bad-ink" : "text-ok-ink"}`}>{msg}</span>}
    </form>
  );
}
