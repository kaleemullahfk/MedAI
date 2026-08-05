import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

/**
 * Catch-all BFF: forwards /api/* requests (other than the specific
 * /api/auth/* handlers above) to the FastAPI backend, attaching the JWT from
 * the HttpOnly cookie as the Authorization header. Supports JSON bodies,
 * multipart uploads, and binary downloads.
 */
export async function proxyRequest(
  request: NextRequest,
): Promise<Response> {
  const pathname = request.nextUrl.pathname.replace(/^\/api/, "");

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) {
    return Response.json({ detail: "Not authenticated." }, { status: 401 });
  }

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const backendUrl = `${BACKEND_URL}${pathname}${request.nextUrl.search}`;

  let body: BodyInit | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    // Preserve the raw body: JSON, FormData (multipart), or empty.
    body = await request.arrayBuffer();
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(headers.entries()),
        Authorization: `Bearer ${token}`,
      },
      body: body as BodyInit | undefined,
      cache: "no-store",
      // Forward redirects from the backend as-is.
      redirect: "manual",
    });
  } catch {
    return Response.json(
      { detail: "Backend is unreachable. Please try again." },
      { status: 502 },
    );
  }

  // Pass through binary/download responses (e.g. report downloads).
  const contentTypeOut = backendResponse.headers.get("content-type");
  const headersOut = new Headers();
  if (contentTypeOut) headersOut.set("content-type", contentTypeOut);

  const contentDisposition = backendResponse.headers.get("content-disposition");
  if (contentDisposition) headersOut.set("content-disposition", contentDisposition);

  // 204/304 have no body; the web Response constructor rejects a body with
  // these statuses, so return an empty response for them.
  if (backendResponse.status === 204 || backendResponse.status === 304) {
    return new Response(null, {
      status: backendResponse.status,
      headers: headersOut,
    });
  }

  const arrayBuffer = await backendResponse.arrayBuffer();
  return new Response(arrayBuffer, {
    status: backendResponse.status,
    headers: headersOut,
  });
}

export { proxyRequest as GET };
export { proxyRequest as POST };
export { proxyRequest as PUT };
export { proxyRequest as PATCH };
export { proxyRequest as DELETE };
