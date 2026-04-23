import { NextResponse, type NextRequest } from "next/server";

/**
 * Legacy signout endpoint. Go backend is stateless — the client drops the JWT.
 */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/login", request.url));
}

export async function POST(request: NextRequest) {
  return GET(request);
}
