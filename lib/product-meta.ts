// Derive a display category + glyph from the product name (presentation only; no DB change).
export type ProductMeta = { tag: string; icon: string; tone: string };

const RULES: [RegExp, ProductMeta][] = [
  [/bot|auto order/i, { tag: "Bot otomatis", icon: "◉", tone: "bg-lake-blue text-parchment" }],
  [/top ?up|saldo|pay/i, { tag: "Top up", icon: "◈", tone: "bg-mint text-navy" }],
  [/desain|feed|canva/i, { tag: "Desain", icon: "✦", tone: "bg-ice text-navy" }],
  [/jasa|landing|web/i, { tag: "Jasa web", icon: "▣", tone: "bg-navy text-parchment" }],
];

export function productMeta(name: string): ProductMeta {
  return RULES.find(([re]) => re.test(name))?.[1] ?? { tag: "Produk digital", icon: "◎", tone: "bg-frost text-navy" };
}

export const cleanName = (name: string) => name.replace(/^\[DEMO\]\s*/, "");
export const isDemo = (name: string) => name.startsWith("[DEMO]");
