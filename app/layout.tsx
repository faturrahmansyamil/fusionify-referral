import type { Metadata, Viewport } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({ variable: "--font-serif-display", subsets: ["latin"], weight: "400", display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-mono-ui", subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Fusionify Referral", template: "%s · Fusionify Referral" },
  description: "Katalog produk Fusionify + program reseller: link & kode promo, komisi otomatis, slip transparan.",
};
export const viewport: Viewport = { themeColor: "#f6f3f1" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${serif.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-mono">{children}</body>
    </html>
  );
}
