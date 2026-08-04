"use client";

import { Bell } from "lucide-react";

export default function Topbar() {
  return (
    <header className="bg-white shadow flex justify-between items-center p-5">
      <div>
        <h2 className="text-2xl font-bold">
          Doctor Dashboard
        </h2>

        <p className="text-gray-500">
          Welcome back 👋
        </p>
      </div>

      <div className="flex items-center gap-5">
        <Bell />

        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
          D
        </div>
      </div>
    </header>
  );
}