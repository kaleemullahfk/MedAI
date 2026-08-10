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
  Info,
  Activity,
  BookOpen,
  Pill,
  FileHeart,
  FileText as FileTextIcon,
  Brain,
} from "lucide-react";

import { SidebarGroup, type SidebarItem } from "@/components/ui/sidebar-group";
import { SidebarFrame, navLinkClass } from "@/components/app/sidebar-frame";

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

  return (
    <SidebarFrame open={open} onClose={onClose}>
      <Link href="/patient" onClick={onClose} className={navLinkClass(pathname === "/patient")}>
        <LayoutDashboard className="h-5 w-5 shrink-0" />
        Dashboard
      </Link>

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

      <SidebarGroup
        label="AI Health Assistant"
        icon={Brain}
        pathname={pathname}
        onNavigate={onClose}
        items={aiTools}
      />

      <Link href="/patient/reports" onClick={onClose} className={navLinkClass(pathname.startsWith("/patient/reports"))}>
        <FileText className="h-5 w-5 shrink-0" />
        Medical Reports
      </Link>

      <Link href="/patient/my-prescriptions" onClick={onClose} className={navLinkClass(pathname.startsWith("/patient/my-prescriptions"))}>
        <FileTextIcon className="h-5 w-5 shrink-0" />
        My Prescriptions
      </Link>

      <Link href="/patient/prescription" onClick={onClose} className={navLinkClass(pathname.startsWith("/patient/prescription"))}>
        <FileHeart className="h-5 w-5 shrink-0" />
        Prescription Analyzer
      </Link>

      <Link href="/patient/chatbot" onClick={onClose} className={navLinkClass(pathname.startsWith("/patient/chatbot"))}>
        <Bot className="h-5 w-5 shrink-0" />
        AI Chatbot
      </Link>

      <Link href="/patient/profile" onClick={onClose} className={navLinkClass(pathname.startsWith("/patient/profile"))}>
        <User className="h-5 w-5 shrink-0" />
        Profile
      </Link>

      <Link href="/patient/about" onClick={onClose} className={navLinkClass(pathname.startsWith("/patient/about"))}>
        <Info className="h-5 w-5 shrink-0" />
        About
      </Link>
    </SidebarFrame>
  );
}