"use client";

import Sidebar from "@/components/patient/Sidebar";
import Topbar from "@/components/patient/Topbar";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <Topbar />

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}