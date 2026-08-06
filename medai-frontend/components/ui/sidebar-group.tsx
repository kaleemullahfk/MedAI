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
 * A collapsible sidebar section. It opens automatically whenever a child
 * route is active; otherwise the user can toggle it with a smooth animation.
 * `userClosed` tracks an explicit user collapse so it stays collapsed even
 * while a child is not active.
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
  const [userClosed, setUserClosed] = useState(false);

  // Derive the open state: a child being active overrides a manual collapse.
  const open = anyActive || (defaultOpen && !userClosed);

  return (
    <div>
      <button
        type="button"
        onClick={() => setUserClosed((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors",
          anyActive
            ? "text-white"
            : "text-slate-300 hover:bg-slate-800 hover:text-white",
        )}
      >
        <span className="flex items-center gap-3">
          <GroupIcon className="h-5 w-5 shrink-0" />
          {label}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
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
          <div className="ml-4 space-y-1 border-l border-slate-700/60 py-1 pl-3">
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
                      ? "bg-blue-600/30 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white",
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
