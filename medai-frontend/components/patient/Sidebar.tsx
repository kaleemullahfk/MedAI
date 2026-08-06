"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarDays,
  FileText,
  Bot,
  User,
  LogOut,
  Activity,
  BookOpen,
  Pill,
  FileHeart,
  FileText as FileTextIcon,
  HeartPulse,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const menu = [
  { name: "Dashboard", href: "/patient", icon: LayoutDashboard },
  { name: "Book Appointment", href: "/patient/book", icon: CalendarPlus },
  { name: "My Appointments", href: "/patient/appointments", icon: CalendarDays },
  { name: "AI Symptom Checker", href: "/patient/symptom-checker", icon: Activity },
  { name: "Medical Reports", href: "/patient/reports", icon: FileText },
  { name: "AI Chatbot", href: "/patient/chatbot", icon: Bot },
  { name: "Profile", href: "/patient/profile", icon: User },
  { name: "AI Medicine", href: "/patient/medicine-recommendation", icon: Pill },
  { name: "Disease Explanation", href: "/patient/disease-explanation", icon: BookOpen },
  { name: "My Prescriptions", href: "/patient/my-prescriptions", icon: FileTextIcon },
  { name: "Prescription Analyzer", href: "/patient/prescription", icon: FileHeart },
];

export default function PatientSidebar({
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
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <span className="flex items-center gap-2 text-2xl font-bold">
            <HeartPulse className="h-7 w-7 text-blue-400" />
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
          {menu.map((item) => {
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
