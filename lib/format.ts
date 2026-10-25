const idr = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
export const rupiah = (n: number) => idr.format(n).replace(/\u00a0/g, " ");

export const tanggal = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(iso));

/** Awal bulan berjalan (WIB) dalam ISO, untuk leaderboard bulanan. */
export function startOfMonthWib(now = new Date()): string {
  const wib = new Date(now.getTime() + 7 * 3600_000);
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), 1) - 7 * 3600_000).toISOString();
}

/** Estimasi komisi (cermin rumus SQL mark_order_paid). */
export function estimateCommission(type: "percent" | "flat", value: number, total: number, qty: number): number {
  return type === "percent" ? Math.floor((total * value) / 100) : value * qty;
}

export const FLAG_LABEL: Record<string, string> = {
  self_referral: "Beli pakai kode sendiri",
  velocity: "Terlalu banyak order/jam",
  buyer_multi_code: "Pembeli pakai kode lain sebelumnya",
};
