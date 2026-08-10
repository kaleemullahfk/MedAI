"use client";

import { Bell, Menu, Search, HeartPulse } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/theme-toggle";

interface AppTopbarProps {
  roleLabel: string;
  pageTitle?: string;
  onMenuClick: () => void;
}

/**
 * Premium shared top bar: page title + subtitle, search, theme toggle,
 * notifications and user avatar — consistent across all roles.
 */
export function AppTopbar({ roleLabel, pageTitle, onMenuClick }: AppTopbarProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground md:text-xl">
            {pageTitle ?? roleLabel}
          </h1>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {user ? (
              <>
                Welcome back, <span className="font-medium text-foreground/80">{user.full_name}</span>
              </>
            ) : (
              roleLabel
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Search (decorative quick search icon to preserve layout) */}
        <button
          className="hidden items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted md:flex"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
          <span className="hidden xl:inline">Search…</span>
        </button>

        <ThemeToggle />

        <button
          className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-muted"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-teal-500 ring-2 ring-background" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground ring-2 ring-background">
          {user?.full_name?.charAt(0)?.toUpperCase() ?? <HeartPulse className="h-4 w-4" />}
        </div>
      </div>
    </header>
  );
}