"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

import { getMyAppointments } from "@/services/patient";
import { toApiError } from "@/services/api";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

interface Appointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: string;
  doctor_id: number;
  doctor?: { id: number; full_name: string } | null;
}

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-500",
  Accepted: "bg-emerald-600",
  Completed: "bg-blue-600",
  Rejected: "bg-red-600",
  Cancelled: "bg-red-600",
};

export default function MyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyAppointments()
      .then((data) => {
        if (!cancelled) setAppointments(data);
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err).message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Appointments</h1>

      {appointments === null ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="No appointments yet"
          description="Book an appointment with a doctor to get started."
        />
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex flex-col justify-between gap-4 rounded-xl bg-card p-6 shadow ring-1 ring-foreground/10 sm:flex-row sm:items-center"
            >
              <div>
                <h2 className="text-lg font-semibold">
                  {appointment.doctor?.full_name ?? `Doctor #${appointment.doctor_id}`}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {appointment.appointment_date} · {appointment.appointment_time}
                </p>
                <p className="mt-2">
                  <strong>Reason:</strong> {appointment.reason}
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-medium text-white ${
                  statusStyles[appointment.status] ?? "bg-gray-500"
                }`}
              >
                {appointment.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
