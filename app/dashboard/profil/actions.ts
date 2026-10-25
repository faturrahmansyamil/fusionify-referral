"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { waSchema } from "@/lib/validation";

const schema = z.object({
  fullName: z.string().trim().min(2).max(80),
  whatsapp: waSchema,
  payoutMethod: z.string().trim().min(2).max(40),
  payoutAccount: z.string().trim().min(4).max(60),
});

export async function saveProfile(_: string | null, fd: FormData): Promise<string | null> {
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Data tidak valid";
  const { supabase, user } = await getSession();
  const d = parsed.data;
  // RLS + column grant: hanya kolom ini yang boleh diubah user sendiri.
  const { error } = await supabase.from("profiles").update({
    full_name: d.fullName, whatsapp: d.whatsapp, payout_method: d.payoutMethod, payout_account: d.payoutAccount,
  }).eq("id", user.id);
  if (error) return "Gagal menyimpan";
  revalidatePath("/dashboard");
  return "Tersimpan ✓";
}
