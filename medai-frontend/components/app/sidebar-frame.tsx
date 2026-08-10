"use client";

import { X, HeartPulse, LogOut } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SidebarFrameProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Shared premium sidebar frame: navy surface, MEDAI brand, nav children,
 * user chip and logout — consistent across Patient / Doctor / Admin.
 */
export function SidebarFrame({ open, onClose, children }: SidebarFrameProps) {
  const { user, logout } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <span className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-sidebar-foreground">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <HeartPulse className="h-5 w-5" />
            </span>
            MEDAI
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-sidebar-foreground/60 transition hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">{children}</nav>

        {/* User + logout */}
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-sidebar-accent/60 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
              {user?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.full_name ?? "User"}
              </p>
              <p className="truncate text-xs capitalize text-sidebar-foreground/60">
                {user?.role ?? "—"}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-sidebar-border px-4 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

/** Standard classes for a nav link in the shared frame. */
export function navLinkClass(active: boolean): string {
  return cn(
    "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
    active
      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
  );
}