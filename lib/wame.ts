import { rupiah } from "./format";

export type OrderSummary = {
  order_ref: string;
  product_name: string;
  qty: number;
  subtotal: number;
  discount: number;
  total: number;
  code: string | null;
};

/** Pesan WA terisi otomatis. Kode order (#FD-XXXXXX) dibawa ke chat supaya admin tidak menebak atribusi. */
export function buildOrderMessage(o: OrderSummary, buyerName: string): string {
  const lines = [
    `Halo Fusionify, saya mau order #${o.order_ref}`,
    ``,
    `Nama: ${buyerName}`,
    `Produk: ${o.product_name} x${o.qty}`,
    `Subtotal: ${rupiah(o.subtotal)}`,
  ];
  if (o.discount > 0) lines.push(`Diskon${o.code ? ` (${o.code})` : ""}: -${rupiah(o.discount)}`);
  lines.push(`Total: ${rupiah(o.total)}`);
  if (o.code) lines.push(`Kode ref: ${o.code}`);
  lines.push(``, `Mohon info pembayarannya, terima kasih.`);
  return lines.join("\n");
}

export function waLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
