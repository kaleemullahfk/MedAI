import axios from "axios";

/**
 * Same-origin API client. All requests go to /api/* on the Next.js origin,
 * where a catch-all route handler forwards them to the FastAPI backend with
 * the JWT from the HttpOnly cookie attached server-side. The token never
 * exists in JavaScript, so there is no localStorage surface to XSS.
 */
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Normalized API error: extracts the backend `detail` (string or array) into
 * a single human-readable message. Thrown by every service on failure.
 */
export class ApiError extends Error {
  status: number | undefined;
  code: string | undefined;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: string | unknown[]; code?: string }
      | undefined;
    let message = "Something went wrong. Please try again.";

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
      // Pydantic validation errors: [{ msg, loc, type }, ...]
      const first = data.detail[0] as { msg?: string } | undefined;
      if (first?.msg) message = first.msg;
    } else if (error.response?.status === 401) {
      message = "Your session has expired. Please log in again.";
    } else if (error.response?.status === 403) {
      message = "You don't have permission to do that.";
    } else if (error.response?.status === 404) {
      message = "The requested resource was not found.";
    }

    return new ApiError(message, error.response?.status, data?.code);
  }

  if (error instanceof Error) return new ApiError(error.message);
  return new ApiError("Something went wrong. Please try again.");
}

export default api;
