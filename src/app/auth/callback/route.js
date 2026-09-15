import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeReturnPath(value) {
  if (value?.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/";
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const returnTo = getSafeReturnPath(requestUrl.searchParams.get("returnTo"));
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_callback`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth_callback`);
  }

  return NextResponse.redirect(new URL(returnTo, origin));
}
