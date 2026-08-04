"use client";

import { Bell } from "lucide-react";

export default function Topbar() {
  return (
    <header className="bg-white shadow h-20 px-8 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">
          Patient Dashboard
        </h1>

        <p className="text-gray-500">
          Welcome back 👋
        </p>
      </div>

      <div className="flex items-center gap-5">
        <Bell />

        <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center">
          P
        </div>
      </div>
    </header>
  );
}