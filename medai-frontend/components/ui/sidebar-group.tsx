"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarGroupProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SidebarItem[];
  pathname: string;
  onNavigate?: () => void;
  defaultOpen?: boolean;
}

/**
 * A collapsible sidebar section with a smooth expand/collapse animation.
 *
 * Behavior:
 * - The user can toggle it open/closed at any time.
 * - When a child route is active the section is always shown open, so the
 *   current page stays visible even if the group is collapsed elsewhere.
 * - The open state resets when the active child changes, so expanding a group
 *   on one page doesn't leave it stuck open on another.
 */
export function SidebarGroup({
  label,
  icon: GroupIcon,
  items,
  pathname,
  onNavigate,
  defaultOpen = false,
}: SidebarGroupProps) {
  const anyActive = items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );

  // `openKey` is the id of the currently-active child, or "none" (which is
  // "none" for every inactive route). We key the toggle state by it so the
  // group auto-opens for the active child and resets elsewhere.
  const openKey = items.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  )?.href ?? "none";

  const [isOpen, setIsOpen] = useState(defaultOpen || openKey !== "none");

  // When the active child changes, sync the toggle state: open for the active
  // child, otherwise keep the user's previous choice only if nothing is active.
  const [lastKey, setLastKey] = useState(openKey);
  if (lastKey !== openKey) {
    setLastKey(openKey);
    setIsOpen(openKey !== "none" || defaultOpen);
  }

  const open = anyActive || isOpen;

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
          anyActive
            ? "text-sidebar-foreground"
            : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        )}
      >
        <span className="flex items-center gap-3">
          <GroupIcon className="h-5 w-5 shrink-0" />
          {label}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-sidebar-foreground/50 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "grid overflow-hidden transition-all duration-200 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0">
          <div className="ml-5 space-y-1 border-l border-sidebar-border py-1 pl-3">
            {items.map((item) => {
              const ItemIcon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary/25 text-sidebar-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  <ItemIcon className="h-4 w-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
