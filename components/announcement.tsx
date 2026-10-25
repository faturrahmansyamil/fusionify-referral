"use client";
import Link from "next/link";
import { useState } from "react";

export function Announcement() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="bg-ink text-parchment">
      <div className="mx-auto flex min-h-10 max-w-[1432px] items-center gap-3 px-4 py-2 text-[12px] sm:px-8 sm:text-[14px]">
        <p className="flex-1 truncate">Program reseller Fusionify dibuka — dapatkan link &amp; kode promo sendiri.</p>
        <Link href="/daftar" className="hidden rounded-full border border-parchment px-3 py-1 text-[12px] uppercase hover:bg-parchment hover:text-ink sm:inline-flex">Daftar</Link>
        <button onClick={() => setOpen(false)} aria-label="Tutup pengumuman" className="px-1 text-[16px] leading-none">×</button>
      </div>
    </div>
  );
}
