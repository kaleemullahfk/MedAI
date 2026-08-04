import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: "blue" | "emerald" | "amber" | "violet";
  className?: string;
}

const accents: Record<NonNullable<DashboardCardProps["accent"]>, string> = {
  blue: "bg-blue-600/15 text-blue-600",
  emerald: "bg-emerald-600/15 text-emerald-600",
  amber: "bg-amber-600/15 text-amber-600",
  violet: "bg-violet-600/15 text-violet-600",
};

export function DashboardCard({
  title,
  value,
  icon: Icon,
  accent = "blue",
  className,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl bg-card p-6 shadow-lg ring-1 ring-foreground/10",
        className,
      )}
    >
      {Icon && (
        <span
          className={cn(
            "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            accents[accent],
          )}
        >
          <Icon className="h-6 w-6" />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
}
