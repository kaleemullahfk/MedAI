import api, { toApiError } from "./api";
import type { LoginRequest, RegisterRequest, User } from "@/types/auth";

/**
 * Login via the BFF, which sets the HttpOnly `medai_token` cookie. The JWT
 * never reaches browser JavaScript.
 */
export async function loginUser(credentials: LoginRequest): Promise<{ user: User }> {
  try {
    const response = await api.post("/auth/login", credentials);
    return response.data as { user: User };
  } catch (error) {
    throw toApiError(error);
  }
}

/** Fetch the current user from the BFF, which decodes the cookie JWT. */
export async function getCurrentUser(): Promise<User> {
  try {
    const response = await api.get("/auth/me");
    return response.data as User;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function registerUser(payload: RegisterRequest): Promise<User> {
  try {
    const response = await api.post("/auth/register", payload);
    return response.data as User;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    // Best-effort: the client cookie is cleared regardless via the BFF.
    throw toApiError(error);
  }
}
