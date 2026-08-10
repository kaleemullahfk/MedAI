"use client";

import { AppTopbar } from "@/components/app/bar";

export default function DoctorTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  return <AppTopbar roleLabel="Doctor Dashboard" onMenuClick={onMenuClick} />;
}