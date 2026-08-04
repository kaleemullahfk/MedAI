import { jwtVerify, SignJWT } from "jose";
import type { Role } from "@/types/auth";

export const AUTH_COOKIE = "medai_token";

export interface TokenPayload {
  /** email (backend `sub` claim) */
  sub: string;
  role: Role;
  user_id: number;
  iat?: number;
  exp?: number;
}

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET is not configured. It must match the backend SECRET_KEY.",
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Verify a JWT and return its claims. Returns null on any failure so callers
 * (proxy, route handlers) can treat it as "not authenticated".
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sub !== "string" || !payload.role) return null;
    return {
      sub: payload.sub,
      role: payload.role as Role,
      user_id: Number(payload.user_id),
      iat: payload.iat as number | undefined,
      exp: payload.exp as number | undefined,
    };
  } catch {
    return null;
  }
}

/** Sign a token (used only in tests / dev tooling). */
export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey());
}
