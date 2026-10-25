import Link from "next/link";
import { Logo, Mascot, Washes } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="relative isolate grid min-h-dvh place-items-center px-4 py-12 text-center">
      <Washes />
      <div className="flex max-w-md flex-col items-center">
        <Logo />
        <Mascot mood="confused" size={120} className="mt-10" />
        <p className="eyebrow mt-6">404</p>
        <h1 className="mt-2 text-[40px]">Halaman tidak ditemukan.</h1>
        <Link href="/" className="btn-primary mt-8">Ke beranda</Link>
      </div>
    </main>
  );
}
