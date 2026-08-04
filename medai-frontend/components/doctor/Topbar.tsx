"use client";

import { Bell, Menu } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

export default function DoctorTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 hover:bg-muted lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold md:text-2xl">Doctor Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {user ? `Welcome back, Dr. ${user.full_name}` : "Welcome back"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="rounded-md p-2 hover:bg-muted" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
          {user?.full_name?.charAt(0) ?? "D"}
        </div>
      </div>
    </header>
  );
}
