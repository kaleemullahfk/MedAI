import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { AUTH_COOKIE, verifyToken } from "@/lib/auth";
import type { User } from "@/types/auth";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ detail: "Invalid session." }, { status: 401 });
  }

  // Enrich the verified claims with the full user profile from the backend.
  try {
    const res = await fetch(`${BACKEND_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.ok) {
      const user = (await res.json()) as User;
      return NextResponse.json(user, { status: 200 });
    }

    // Fallback to claims-only so the client still has a working session.
    const fallback: User = {
      id: payload.user_id,
      full_name: payload.sub,
      email: payload.sub,
      role: payload.role,
      is_active: true,
    };
    return NextResponse.json(fallback, { status: 200 });
  } catch {
    const fallback: User = {
      id: payload.user_id,
      full_name: payload.sub,
      email: payload.sub,
      role: payload.role,
      is_active: true,
    };
    return NextResponse.json(fallback, { status: 200 });
  }
}
