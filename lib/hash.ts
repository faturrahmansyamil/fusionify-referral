import "server-only";
import { createHash } from "node:crypto";

/** Hash satu arah (dengan salt) untuk IP/visitor — data mentah tidak disimpan. */
export function hashId(value: string): string {
  const salt = process.env.HASH_SALT ?? "";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex").slice(0, 32);
}
