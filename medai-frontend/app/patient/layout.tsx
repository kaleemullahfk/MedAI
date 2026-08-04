"use client";

import { useState } from "react";

import { RoleGuard } from "@/components/auth/RoleGuard";
import Sidebar from "@/components/patient/Sidebar";
import Topbar from "@/components/patient/Topbar";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RoleGuard role="patient">
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
