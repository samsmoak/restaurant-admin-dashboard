import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { STUDIO_HOME, STUDIO_LOGIN } from "@/lib/studio";

// Admin dashboard: every non-public route requires an authenticated admin.
// Public routes: /login, /onboard (and /onboard/finalize), /auth/callback.
const PUBLIC_PREFIXES = ["/login", "/onboard", "/auth/callback"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) =>
      pathname === p ||
      pathname.startsWith(p + "/") ||
      pathname.startsWith(p + "?")
  );
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;

  // Env not configured: keep login reachable, bounce everything else.
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl === "your_supabase_project_url" ||
    supabaseAnonKey === "your_supabase_anon_key"
  ) {
    if (!isPublic(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = STUDIO_LOGIN;
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = !!data;
  }

  // Dashboard gate: every non-public route requires an authenticated admin.
  if (!isPublic(pathname)) {
    if (!user || !isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = STUDIO_LOGIN;
      return NextResponse.redirect(url);
    }
  }

  // Signed-in admin hitting /login → bounce to dashboard home.
  if (user && isAdmin && pathname === STUDIO_LOGIN) {
    const url = request.nextUrl.clone();
    url.pathname = STUDIO_HOME;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
