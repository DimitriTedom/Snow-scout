"use server";

import { z } from "zod";

import { getAuthCallbackUrl } from "@/lib/auth/site-url";
import { syncUserFromAuth } from "@/lib/auth/sync-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/lib/validations";

export async function signInAction(input: z.infer<typeof signInSchema> & { next?: string }) {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false as const, error: "Missing Supabase environment variables." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  if (data.user) {
    await syncUserFromAuth(data.user);
  }

  return { ok: true as const, redirectTo: input.next ?? "/dashboard" };
}

export async function signUpAction(input: z.infer<typeof signUpSchema>) {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false as const, error: "Missing Supabase environment variables." };
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: getAuthCallbackUrl("/dashboard"),
      data: {
        display_name: parsed.data.displayName?.trim() || null,
      },
    },
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  const user = data.user;
  if (user) {
    await syncUserFromAuth(user, parsed.data.displayName);
  }

  if (data.session) {
    return { ok: true as const, redirectTo: "/dashboard" };
  }

  return {
    ok: true as const,
    needsEmailConfirmation: true as const,
    redirectTo: "/auth/login?registered=1",
  };
}
