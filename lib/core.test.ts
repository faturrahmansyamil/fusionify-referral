import { describe, expect, it } from "vitest";
import { normalizeWa, orderSchema, tokenSchema } from "./validation";
import { cleanCode, campaignFromParams, resolveAttribution } from "./attribution";
import { buildOrderMessage, waLink } from "./wame";
import { rupiah, estimateCommission, startOfMonthWib } from "./format";

describe("normalizeWa", () => {
  it.each([
    ["081234567890", "6281234567890"],
    ["+62 812-3456-7890", "6281234567890"],
    ["6281234567890", "6281234567890"],
    ["81234567890", "6281234567890"],
  ])("%s -> %s", (i, o) => expect(normalizeWa(i)).toBe(o));
  it.each(["", "abc", "0812", "+1 555 123 4567", "08123456789012345"])("tolak %s", (i) => expect(normalizeWa(i)).toBeNull());
});

describe("orderSchema", () => {
  const base = { productId: "5d1f0c2e-7a3b-4c4d-9e5f-6a7b8c9d0e01", qty: "2", buyerName: " Ani ", buyerWa: "0812 3456 7890", promoCode: "" };
  it("valid + normalisasi", () => {
    const r = orderSchema.parse(base);
    expect(r).toEqual({ productId: base.productId, qty: 2, buyerName: "Ani", buyerWa: "6281234567890", promoCode: null });
  });
  it("UUID seed lolos z.uuid() ketat", () => {
    for (const id of ["0b5e2f8a-1c3d-4e5f-8a6b-7c8d9e0f1a01", "9c3b2a1d-5e6f-4a7b-b8c9-d0e1f2a3b401", "b4c5d6e7-f809-4a1b-8c2d-3e4f5a6b7c01", "7e2a1b3c-4d5e-4f60-a172-8394a5b6c701"])
      expect(orderSchema.safeParse({ ...base, productId: id }).success).toBe(true);
  });
  it("tolak UUID non-RFC", () => expect(orderSchema.safeParse({ ...base, productId: "11111111-1111-1111-1111-111111111111" }).success).toBe(false));
  it("tolak qty 0 / 51", () => {
    expect(orderSchema.safeParse({ ...base, qty: "0" }).success).toBe(false);
    expect(orderSchema.safeParse({ ...base, qty: "51" }).success).toBe(false);
  });
  it("tolak kode promo aneh", () => expect(orderSchema.safeParse({ ...base, promoCode: "RINA-10'" }).success).toBe(false));
});

describe("atribusi", () => {
  it("kode diketik menang atas cookie", () => expect(resolveAttribution("RINA10", "BAGAS")).toBe("code"));
  it("cookie saja -> link", () => expect(resolveAttribution(null, "BAGAS")).toBe("link"));
  it("tanpa apa-apa -> none", () => expect(resolveAttribution(null, null)).toBe("none"));
  it("cleanCode uppercase & tolak injeksi", () => {
    expect(cleanCode("rina10")).toBe("RINA10");
    expect(cleanCode("x' or 1=1")).toBeNull();
    expect(cleanCode(undefined)).toBeNull();
  });
  it("campaign dari ?c atau utm_campaign", () => {
    expect(campaignFromParams(new URLSearchParams("c=ig-oktober"))).toBe("ig-oktober");
    expect(campaignFromParams(new URLSearchParams("utm_campaign=WA-Grup"))).toBe("wa-grup");
    expect(campaignFromParams(new URLSearchParams("c=<script>"))).toBeNull();
  });
});

describe("pesan wa.me", () => {
  const o = { order_ref: "FD-ABC234", product_name: "Premium 1 Bulan", qty: 2, subtotal: 50000, discount: 5000, total: 45000, code: "RINA10" };
  it("memuat kode order, diskon, kode ref", () => {
    const m = buildOrderMessage(o, "Ani");
    expect(m).toContain("#FD-ABC234");
    expect(m).toContain("Diskon (RINA10): -Rp 5.000");
    expect(m).toContain("Total: Rp 45.000");
    expect(m).toContain("Kode ref: RINA10");
  });
  it("tanpa diskon tidak ada baris diskon", () => expect(buildOrderMessage({ ...o, discount: 0, code: null }, "A")).not.toContain("Diskon"));
  it("link ter-encode", () => expect(waLink("6281200000000", "a b&c")).toBe("https://wa.me/6281200000000?text=a%20b%26c"));
});

describe("format & komisi", () => {
  it("rupiah", () => expect(rupiah(1500000)).toBe("Rp 1.500.000"));
  it("komisi persen dibulatkan ke bawah (sama dgn SQL floor)", () => expect(estimateCommission("percent", 15, 99999, 1)).toBe(14999));
  it("komisi flat x qty", () => expect(estimateCommission("flat", 1000, 101500, 3)).toBe(3000));
  it("awal bulan WIB", () => expect(startOfMonthWib(new Date("2026-10-31T20:00:00Z"))).toBe("2026-10-31T17:00:00.000Z"));
  it("token slip 48 hex", () => {
    expect(tokenSchema.safeParse("a".repeat(48)).success).toBe(true);
    expect(tokenSchema.safeParse("g".repeat(48)).success).toBe(false);
  });
});
