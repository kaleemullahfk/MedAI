"use client";

import { useState } from "react";

import { RoleGuard } from "@/components/auth/RoleGuard";
import Sidebar from "@/components/doctor/Sidebar";
import Topbar from "@/components/doctor/Topbar";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RoleGuard role="doctor">
      <div className="flex min-h-screen bg-muted/40">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-1 flex-col">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
