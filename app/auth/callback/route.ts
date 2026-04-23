import { NextResponse, type NextRequest } from "next/server";
import { STUDIO_LOGIN } from "@/lib/studio";

/**
 * Legacy Supabase OAuth callback. The Go backend uses Google Identity
 * Services client-side, so there's no server-side OAuth round-trip.
 * Any stale hits land the user at /login with the next path preserved.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || STUDIO_LOGIN;
  const errorDescription = url.searchParams.get("error_description");

  const redirect = new URL(STUDIO_LOGIN, url.origin);
  if (next !== STUDIO_LOGIN) redirect.searchParams.set("next", next);
  if (errorDescription) redirect.searchParams.set("error", errorDescription);
  return NextResponse.redirect(redirect);
}
