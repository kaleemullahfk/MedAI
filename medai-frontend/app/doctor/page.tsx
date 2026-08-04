"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Users, FileText, Bot } from "lucide-react";

import { DashboardCard } from "@/components/ui/dashboard-card";
import { ErrorState } from "@/components/ui/error-state";
import { getDoctorDashboard } from "@/services/dashboard";
import { toApiError } from "@/services/api";

interface DoctorDashboardData {
  appointments: number;
  patients: number;
  reports: number;
  chats: number;
}

export default function DoctorDashboard() {
  const [dashboard, setDashboard] = useState<DoctorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getDoctorDashboard()
      .then((data) => {
        if (cancelled) return;
        setDashboard(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(toApiError(err).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const load = useCallback(() => {
    setLoading(true);
    setNonce((n) => n + 1);
  }, []);

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Doctor Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <>
            <div className="h-28 animate-pulse rounded-2xl bg-muted" />
            <div className="h-28 animate-pulse rounded-2xl bg-muted" />
            <div className="h-28 animate-pulse rounded-2xl bg-muted" />
            <div className="h-28 animate-pulse rounded-2xl bg-muted" />
          </>
        ) : (
          dashboard && (
            <>
              <DashboardCard
                title="Appointments"
                value={dashboard.appointments}
                icon={CalendarDays}
                accent="blue"
              />
              <DashboardCard
                title="Patients"
                value={dashboard.patients}
                icon={Users}
                accent="emerald"
              />
              <DashboardCard
                title="Reports"
                value={dashboard.reports}
                icon={FileText}
                accent="amber"
              />
              <DashboardCard
                title="AI Chats"
                value={dashboard.chats}
                icon={Bot}
                accent="violet"
              />
            </>
          )
        )}
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-lg ring-1 ring-foreground/10">
        <h2 className="mb-3 text-xl font-bold">Today&apos;s Schedule</h2>
        <p className="text-muted-foreground">
          Appointment list will appear here.
        </p>
      </div>
    </div>
  );
}
