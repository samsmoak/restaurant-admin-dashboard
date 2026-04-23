import { NextResponse, type NextRequest } from 'next/server';

/**
 * No-op proxy. Auth is entirely client-side now (JWT in localStorage).
 * Route gating happens in `app/(dashboard)/layout.tsx`, which redirects
 * unauthenticated users to /login and users without an active restaurant
 * to /onboard. The previous Supabase-cookie middleware has been removed.
 */
export async function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
