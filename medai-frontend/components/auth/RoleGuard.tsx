"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/types/auth";

/**
 * Client-side role guard. Defense-in-depth beneath proxy.ts: if the logged-in
 * user's role does not match the required role, the user is redirected to the
 * login page. While the session is being determined (AuthContext loading, or a
 * session cookie exists but the user object isn't populated yet), a loader is
 * shown instead of prematurely redirecting.
 */
export function RoleGuard({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Decided whether to redirect: only when we're certain there is no valid
  // session for this role. `loading` guards the initial fetch; `user === null`
  // with a completed load means no session.
  const shouldRedirect = !loading && user === null;
  const allowed = user !== null && user.role === role;

  useEffect(() => {
    if (shouldRedirect || (!allowed && user !== null)) {
      router.replace("/");
    }
  }, [shouldRedirect, allowed, user, router]);

  if (loading || user === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!allowed) {
    // Wrong role: redirect handled in the effect above; show loader meanwhile.
    return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
