"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({ email: z.email(), password: z.string().min(8).max(128) });
const signupSchema = loginSchema.extend({ fullName: z.string().trim().min(2).max(80) });

export async function login(_: string | null, fd: FormData): Promise<string | null> {
  const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return "Email atau password tidak valid";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return "Email atau password salah"; // pesan generik
  redirect("/dashboard");
}

export async function signup(_: string | null, fd: FormData): Promise<string | null> {
  const parsed = signupSchema.safeParse({ email: fd.get("email"), password: fd.get("password"), fullName: fd.get("fullName") });
  if (!parsed.success) return "Isi nama, email valid, dan password minimal 8 karakter";
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email, password: parsed.data.password,
    // app='referral' → trigger referral_on_auth_user_created membuat referral.profiles (user umkm tidak tersentuh)
    options: { data: { full_name: parsed.data.fullName, app: "referral" } },
  });
  if (error) return "Pendaftaran gagal, coba lagi";
  return "OK";
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
