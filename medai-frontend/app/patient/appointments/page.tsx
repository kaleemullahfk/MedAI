"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Loader2, X, CalendarClock } from "lucide-react";

import {
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
} from "@/services/patient";
import { toApiError } from "@/services/api";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const load = () => {
    getMyAppointments()
      .then(setAppointments)
      .catch((err) => setError(toApiError(err).message));
  };

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

  const onCancel = async (id: number) => {
    if (!confirm("Cancel this appointment?")) return;
    setBusyId(id);
    try {
      await cancelAppointment(id);
      toast.success("Appointment cancelled.");
      load();
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  const openReschedule = (id: number, date: string, time: string) => {
    setRescheduleId(id);
    setNewDate(date);
    setNewTime(time);
  };

  const submitReschedule = async () => {
    if (!rescheduleId) return;
    if (!newDate || !newTime) {
      toast.error("Choose a date and time.");
      return;
    }
    setBusyId(rescheduleId);
    try {
      await rescheduleAppointment(rescheduleId, { new_date: newDate, new_time: newTime });
      toast.success("Appointment rescheduled.");
      setRescheduleId(null);
      load();
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

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
              className="rounded-xl bg-card p-6 shadow ring-1 ring-foreground/10"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
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

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-4 py-2 text-sm font-medium text-white ${
                      statusStyles[appointment.status] ?? "bg-gray-500"
                    }`}
                  >
                    {appointment.status}
                  </span>

                  {["Pending", "Accepted"].includes(appointment.status) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openReschedule(
                            appointment.id,
                            appointment.appointment_date,
                            appointment.appointment_time,
                          )
                        }
                      >
                        <CalendarClock className="h-4 w-4" />
                        Reschedule
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={busyId === appointment.id}
                        onClick={() => onCancel(appointment.id)}
                      >
                        {busyId === appointment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {rescheduleId === appointment.id && (
                <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`rd-${appointment.id}`}>New date</Label>
                    <Input
                      id={`rd-${appointment.id}`}
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`rt-${appointment.id}`}>New time (24h)</Label>
                    <Input
                      id={`rt-${appointment.id}`}
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button onClick={submitReschedule} disabled={busyId === appointment.id}>
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setRescheduleId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
