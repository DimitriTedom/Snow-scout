import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}