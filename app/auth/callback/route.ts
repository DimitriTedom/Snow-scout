import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { syncUserFromAuth } from "@/lib/auth/sync-user";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  const redirectTarget = new URL(next, requestUrl.origin);
  const response = NextResponse.redirect(redirectTarget);

  const supabase = createSupabaseRouteHandlerClient(request, response);
  if (!supabase) {
    return NextResponse.redirect(
      new URL("/auth/login?error=missing_supabase_config", requestUrl.origin),
    );
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL("/auth/login?error=auth_callback_failed", requestUrl.origin),
      );
    }

    if (data.user) {
      await syncUserFromAuth(data.user);
    }

    return response;
  }

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      return NextResponse.redirect(
        new URL("/auth/login?error=auth_callback_failed", requestUrl.origin),
      );
    }

    if (data.user) {
      await syncUserFromAuth(data.user);
    }

    return response;
  }

  return NextResponse.redirect(
    new URL("/auth/login?error=auth_callback_missing_code", requestUrl.origin),
  );
}