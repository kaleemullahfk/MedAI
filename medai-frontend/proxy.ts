import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

const ROLE_BY_PREFIX: Record<string, string> = {
  "/doctor": "doctor",
  "/patient": "patient",
  "/admin": "admin",
};

/**
 * Route protection (Next 16 renamed middleware.ts -> proxy.ts). Runs on the
 * server before protected routes render. The JWT lives in an HttpOnly cookie,
 * so we verify it locally with jose (no per-request backend round-trip) and
 * enforce role-based access by path prefix.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requiredRole = ROLE_BY_PREFIX[pathname] ?? null;
  if (!requiredRole) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (payload.role !== requiredRole) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/doctor/:path*", "/patient/:path*", "/admin/:path*"],
};
