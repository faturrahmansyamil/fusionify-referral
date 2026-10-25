import type { Metadata, Viewport } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({ variable: "--font-serif-display", subsets: ["latin"], weight: "400", display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-mono-ui", subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Fusionify Referral", template: "%s · Fusionify Referral" },
  description: "Katalog produk Fusionify + program reseller: link & kode promo, komisi otomatis, slip transparan.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://referral.syamxuanify.biz.id"),
};
export const viewport: Viewport = { themeColor: "#14213d" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${serif.variable} ${mono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* marks JS-on before paint so reveal targets start hidden (no flash, no layout shift) */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-full flex-col font-mono">{children}</body>
    </html>
  );
}
