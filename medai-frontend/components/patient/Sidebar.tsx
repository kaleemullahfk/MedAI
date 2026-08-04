"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileHeart } from "lucide-react";

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
} from "lucide-react";

const menu = [
  {
    name: "Dashboard",
    href: "/patient",
    icon: LayoutDashboard,
  },
  {
    name: "Book Appointment",
    href: "/patient/book",
    icon: CalendarPlus,
  },
  {
    name: "My Appointments",
    href: "/patient/appointments",
    icon: CalendarDays,
  },
  {
    name: "AI Symptom Checker",
    href: "/patient/symptom-checker",
    icon: Activity,
  },
  {
    name: "Medical Reports",
    href: "/patient/reports",
    icon: FileText,
  },
  {
    name: "AI Chatbot",
    href: "/patient/chatbot",
    icon: Bot,
  },
  {
    name: "Profile",
    href: "/patient/profile",
    icon: User,
  },
  {
    name: "AI Medicine",
    href: "/patient/medicine-recommendation",
    icon: Pill,
  },
  {
    name: "Disease Explanation",
    href: "/patient/disease-explanation",
    icon: BookOpen,
  },
  {
  name: "Prescription Analyzer",
  href: "/patient/prescription",
  icon: FileHeart,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <aside className="w-72 h-screen bg-slate-900 text-white flex flex-col overflow-hidden">

      {/* Logo */}
      <div className="shrink-0 text-4xl font-bold text-center p-8 border-b border-slate-800">
        🩺 MEDAI
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 rounded-lg p-4 mb-2 transition-all duration-200 ${
                pathname === item.href
                  ? "bg-blue-600"
                  : "hover:bg-slate-800"
              }`}
            >
              <Icon size={22} className="shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="shrink-0 p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full bg-red-600 hover:bg-red-700 transition rounded-lg p-4 flex items-center justify-center gap-3 font-medium"
        >
          <LogOut size={22} />
          Logout
        </button>
      </div>

    </aside>
  );
}