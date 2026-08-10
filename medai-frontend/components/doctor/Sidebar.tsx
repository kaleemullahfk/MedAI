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
} from "lucide-react";

import { SidebarFrame, navLinkClass } from "@/components/app/sidebar-frame";

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

  return (
    <SidebarFrame open={open} onClose={onClose}>
      {menus.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link key={item.name} href={item.href} onClick={onClose} className={navLinkClass(active)}>
            <Icon className="h-5 w-5 shrink-0" />
            {item.name}
          </Link>
        );
      })}
    </SidebarFrame>
  );
}