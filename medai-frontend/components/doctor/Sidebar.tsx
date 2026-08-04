"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FileText,
  Stethoscope,
  MessageCircle,
  User,
  LogOut,
} from "lucide-react";

const menus = [
  {
    name: "Dashboard",
    href: "/doctor",
    icon: LayoutDashboard,
  },
  {
    name: "Appointments",
    href: "/doctor/appointments",
    icon: CalendarDays,
  },
  {
    name: "Patients",
    href: "/doctor/patients",
    icon: Users,
  },
  {
    name: "AI Prescription",
    href: "/doctor/prescription",
    icon: Stethoscope,
  },
  {
    name: "Medical Reports",
    href: "/doctor/reports",
    icon: FileText,
  },
  {
    name: "AI Chatbot",
    href: "/doctor/chatbot",
    icon: MessageCircle,
  },
  {
    name: "Profile",
    href: "/doctor/profile",
    icon: User,
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-10">
        🩺 MEDAI
      </h1>

      <nav className="space-y-2">
        {menus.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition"
            >
              <Icon size={20} />

              {item.name}
            </Link>
          );
        })}
      </nav>

      <button
        className="flex items-center gap-3 mt-12 px-4 py-3 w-full rounded-lg bg-red-600 hover:bg-red-700"
      >
        <LogOut size={20} />

        Logout
      </button>
    </aside>
  );
}