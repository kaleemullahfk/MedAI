"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Check, X, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  getDoctorAppointments,
  acceptAppointment,
  rejectAppointment,
  completeAppointment,
} from "@/services/appointment";
import { toApiError } from "@/services/api";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: string;
  patient?: { id: number; full_name: string } | null;
}

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-500",
  Accepted: "bg-emerald-600",
  Completed: "bg-blue-600",
  Rejected: "bg-red-600",
  Cancelled: "bg-red-600",
};

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    try {
      const data = await getDoctorAppointments();
      setAppointments(data);
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  useEffect(() => {
    let cancelled = false;
    getDoctorAppointments()
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

  const act = async (id: number, action: "accept" | "reject" | "complete") => {
    setBusyId(id);
    setError(null);
    try {
      if (action === "accept") await acceptAppointment(id);
      else if (action === "reject") await rejectAppointment(id);
      else await completeAppointment(id);
      toast.success(`Appointment ${action}ed successfully.`);
      await load();
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <ErrorState message={error} onRetry={() => load()} />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Doctor Appointments</h1>

      {appointments === null ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="No appointments yet"
          description="Appointments booked by patients will appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card shadow ring-1 ring-foreground/10">
          <table className="w-full min-w-max">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-4 text-left" scope="col">Patient</th>
                <th className="p-4 text-left" scope="col">Date</th>
                <th className="p-4 text-left" scope="col">Time</th>
                <th className="p-4 text-left" scope="col">Reason</th>
                <th className="p-4 text-left" scope="col">Status</th>
                <th className="p-4 text-left" scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-4 font-medium">
                    {item.patient?.full_name ?? `Patient #${item.patient_id}`}
                  </td>
                  <td className="p-4">{item.appointment_date}</td>
                  <td className="p-4">{item.appointment_time}</td>
                  <td className="max-w-xs truncate p-4">{item.reason}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium text-white ${
                        statusStyles[item.status] ?? "bg-gray-500"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => act(item.id, "accept")}
                        disabled={busyId === item.id || item.status !== "Pending"}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        aria-label={`Accept appointment ${item.id}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Accept
                      </button>
                      <button
                        onClick={() => act(item.id, "reject")}
                        disabled={busyId === item.id || item.status !== "Pending"}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                        aria-label={`Reject appointment ${item.id}`}
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                      <button
                        onClick={() => act(item.id, "complete")}
                        disabled={busyId === item.id || item.status !== "Accepted"}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                        aria-label={`Complete appointment ${item.id}`}
                      >
                        {busyId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCheck className="h-3.5 w-3.5" />
                        )}
                        Complete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
