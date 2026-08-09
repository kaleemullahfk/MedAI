"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FileText,
  Stethoscope,
  MessageCircle,
  User,
  Info,
  LogOut,
  X,
  Stethoscope as LogoIcon,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const menus = [
  { name: "Dashboard", href: "/doctor", icon: LayoutDashboard },
  { name: "Appointments", href: "/doctor/appointments", icon: CalendarDays },
  { name: "Patients", href: "/doctor/patients", icon: Users },
  { name: "Medical Reports", href: "/doctor/reports", icon: FileText },
  { name: "AI Prescription", href: "/doctor/prescription", icon: Stethoscope },
  { name: "AI Chatbot", href: "/doctor/chatbot", icon: MessageCircle },
  { name: "Profile", href: "/doctor/profile", icon: User },
  { name: "About", href: "/doctor/about", icon: Info },
];

export default function DoctorSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { logout } = useAuth();

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
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <span className="flex items-center gap-2 text-2xl font-bold">
            <LogoIcon className="h-7 w-7 text-blue-400" />
            MEDAI
          </span>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menus.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <button
            onClick={() => logout()}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-red-600 px-4 py-3 text-sm font-medium transition hover:bg-red-700"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
