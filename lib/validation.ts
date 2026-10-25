import { z } from "zod";

/** Normalisasi nomor WA Indonesia ke format 62xxxxxxxxxx. Return null jika tidak valid. */
export function normalizeWa(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "").replace(/^\+/, "");
  if (!/^\d+$/.test(digits)) return null;
  let n = digits;
  if (n.startsWith("0")) n = "62" + n.slice(1);
  else if (n.startsWith("8")) n = "62" + n;
  return /^62\d{8,13}$/.test(n) ? n : null;
}

export const codeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9]{3,20}$/, "Kode 3–20 huruf/angka");

export const waSchema = z
  .string()
  .transform((v, ctx) => {
    const n = normalizeWa(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "Nomor WA tidak valid" });
      return z.NEVER;
    }
    return n;
  });

export const orderSchema = z.object({
  productId: z.uuid(),
  qty: z.coerce.number().int().min(1).max(50),
  buyerName: z.string().trim().min(1, "Nama wajib diisi").max(80),
  buyerWa: waSchema,
  promoCode: z.union([z.literal(""), codeSchema]).optional().transform((v) => (v ? v : null)),
});

export const slugSchema = z.string().regex(/^[a-z0-9-]{2,40}$/);
export const tokenSchema = z.string().regex(/^[0-9a-f]{48}$/);
