import { describe, expect, it } from "vitest";
import { cleanName, isDemo, productMeta } from "./product-meta";

describe("productMeta", () => {
  it("maps bots, top up, design, web, fallback", () => {
    expect(productMeta("[DEMO] Sewa Bot Auto Order Telegram — 1 Bulan").tag).toBe("Bot otomatis");
    expect(productMeta("[DEMO] Top Up Saldo FTV Pay 100rb").tag).toBe("Top up");
    expect(productMeta("[DEMO] Desain Feed Instagram 9 Post").tag).toBe("Desain");
    expect(productMeta("[DEMO] Jasa Landing Page UMKM").tag).toBe("Jasa web");
    expect(productMeta("Sesuatu").tag).toBe("Produk digital");
  });
  it("strips demo prefix", () => {
    expect(cleanName("[DEMO] Jasa Landing Page UMKM")).toBe("Jasa Landing Page UMKM");
    expect(isDemo("[DEMO] x")).toBe(true);
  });
});
