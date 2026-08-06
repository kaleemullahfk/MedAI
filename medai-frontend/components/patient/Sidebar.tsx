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
  Brain,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { SidebarGroup, type SidebarItem } from "@/components/ui/sidebar-group";

const aiTools: SidebarItem[] = [
  { name: "AI Symptom Checker", href: "/patient/symptom-checker", icon: Activity },
  { name: "AI Medicine Recommendation", href: "/patient/medicine-recommendation", icon: Pill },
  { name: "AI Disease Explanation", href: "/patient/disease-explanation", icon: BookOpen },
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
          {/* Dashboard */}
          <Link
            href="/patient"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              pathname === "/patient"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
            )}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            Dashboard
          </Link>

          {/* Appointments group */}
          <SidebarGroup
            label="Appointments"
            icon={CalendarDays}
            pathname={pathname}
            onNavigate={onClose}
            defaultOpen={pathname.startsWith("/patient/book") || pathname.startsWith("/patient/appointments")}
            items={[
              { name: "Book Appointment", href: "/patient/book", icon: CalendarPlus },
              { name: "My Appointments", href: "/patient/appointments", icon: CalendarDays },
            ]}
          />

          {/* AI Health Assistant collapsible */}
          <SidebarGroup
            label="AI Health Assistant"
            icon={Brain}
            pathname={pathname}
            onNavigate={onClose}
            items={aiTools}
          />

          {/* Medical Reports */}
          <Link
            href="/patient/reports"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              pathname.startsWith("/patient/reports")
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
            )}
          >
            <FileText className="h-5 w-5 shrink-0" />
            Medical Reports
          </Link>

          {/* My Prescriptions */}
          <Link
            href="/patient/my-prescriptions"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              pathname.startsWith("/patient/my-prescriptions")
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
            )}
          >
            <FileTextIcon className="h-5 w-5 shrink-0" />
            My Prescriptions
          </Link>

          {/* Prescription Analyzer */}
          <Link
            href="/patient/prescription"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              pathname.startsWith("/patient/prescription")
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
            )}
          >
            <FileHeart className="h-5 w-5 shrink-0" />
            Prescription Analyzer
          </Link>

          {/* AI Chatbot */}
          <Link
            href="/patient/chatbot"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              pathname.startsWith("/patient/chatbot")
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
            )}
          >
            <Bot className="h-5 w-5 shrink-0" />
            AI Chatbot
          </Link>

          {/* Profile */}
          <Link
            href="/patient/profile"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              pathname.startsWith("/patient/profile")
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
            )}
          >
            <User className="h-5 w-5 shrink-0" />
            Profile
          </Link>
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
