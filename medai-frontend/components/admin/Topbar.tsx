"use client";

import { AppTopbar } from "@/components/app/bar";

export default function AdminTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  return <AppTopbar roleLabel="Admin Dashboard" onMenuClick={onMenuClick} />;
}