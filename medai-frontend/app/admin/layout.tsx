"use client";

import { useState } from "react";

import { RoleGuard } from "@/components/auth/RoleGuard";
import AdminSidebar from "@/components/admin/Sidebar";
import AdminTopbar from "@/components/admin/Topbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RoleGuard role="admin">
      <div className="flex min-h-screen bg-muted/40">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-1 flex-col">
          <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
