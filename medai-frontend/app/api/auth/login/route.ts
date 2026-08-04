import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
const COOKIE_NAME = "medai_token";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid request body." }, { status: 400 });
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { detail: "Backend is unreachable. Please try again." },
      { status: 502 },
    );
  }

  const data = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(
      data,
      { status: backendResponse.status },
    );
  }

  const accessToken: unknown = data?.access_token;
  if (typeof accessToken !== "string" || !accessToken) {
    return NextResponse.json(
      { detail: "Backend returned an invalid login response." },
      { status: 502 },
    );
  }

  // Set the JWT in an HttpOnly cookie. Also try to decode a stable user from
  // the backend's `user` field so the client can redirect by role.
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h, mirrors backend ACCESS_TOKEN_EXPIRE_MINUTES
  });

  const user: unknown = data?.user;
  return NextResponse.json({ user }, { status: 200 });
}
