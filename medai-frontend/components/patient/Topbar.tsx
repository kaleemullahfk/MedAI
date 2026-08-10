"use client";

import { AppTopbar } from "@/components/app/bar";

export default function PatientTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  return <AppTopbar roleLabel="Patient Dashboard" onMenuClick={onMenuClick} />;
}