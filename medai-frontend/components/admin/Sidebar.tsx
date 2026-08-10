"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldCheck, BarChart3, Info } from "lucide-react";

import { SidebarFrame, navLinkClass } from "@/components/app/sidebar-frame";

const menu = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "About", href: "/admin/about", icon: Info },
];

export default function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <SidebarFrame open={open} onClose={onClose}>
      {menu.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link key={item.name} href={item.href} onClick={onClose} className={navLinkClass(active)}>
            <Icon className="h-5 w-5 shrink-0" />
            {item.name}
          </Link>
        );
      })}
      <div className="mt-6 rounded-xl border border-sidebar-border bg-sidebar-accent/40 px-3.5 py-3">
        <p className="flex items-center gap-2 text-xs font-semibold text-sidebar-foreground">
          <ShieldCheck className="h-4 w-4 text-teal-400" />
          Admin Console
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-sidebar-foreground/55">
          Platform oversight, user management and analytics.
        </p>
      </div>
    </SidebarFrame>
  );
}