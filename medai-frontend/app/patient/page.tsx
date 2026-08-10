"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  FileText,
  Pill,
  Bot,
  Sparkles,
  ArrowRight,
  HeartPulse,
  ChevronRight,
  CalendarPlus,
  Stethoscope,
} from "lucide-react";

import { getPatientDashboard } from "@/services/dashboard";
import { getMyAppointments, type Appointment as Appt } from "@/services/patient";
import { toApiError } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-500/15 text-amber-600",
  Accepted: "bg-emerald-500/15 text-emerald-600",
  Completed: "bg-blue-500/15 text-blue-600",
  Rejected: "bg-red-500/15 text-red-600",
  Cancelled: "bg-red-500/15 text-red-600",
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{ appointments: number; reports: number; prescriptions: number; chat_history: number } | null>(null);
  const [appointments, setAppointments] = useState<Appt[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPatientDashboard()
      .then((d) => !cancelled && setStats(d))
      .catch((e) => !cancelled && setError(toApiError(e).message));
    getMyAppointments()
      .then((d) => !cancelled && setAppointments(d))
      .catch(() => !cancelled && setAppointments([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ErrorState message={error} />;

  const upcoming = (appointments ?? []).filter((a) =>
    ["Pending", "Accepted"].includes(a.status),
  );
  const loading = stats === null;

  const kpis = [
    { label: "Appointments", value: stats?.appointments ?? 0, icon: CalendarDays, color: "text-blue-600 bg-blue-500/10", href: "/patient/appointments" },
    { label: "Medical Reports", value: stats?.reports ?? 0, icon: FileText, color: "text-teal-600 bg-teal-500/10", href: "/patient/reports" },
    { label: "Prescriptions", value: stats?.prescriptions ?? 0, icon: Pill, color: "text-violet-600 bg-violet-500/10", href: "/patient/my-prescriptions" },
    { label: "AI Chats", value: stats?.chat_history ?? 0, icon: Bot, color: "text-amber-600 bg-amber-500/10", href: "/patient/chatbot" },
  ];

  return (
    <div className="space-y-7">
      {/* Greeting hero */}
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary-foreground/70">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
              Welcome back, {user?.full_name?.split(" ")[0] ?? "there"}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-primary-foreground/75">
              Your health, in one place. Book appointments, review reports, and
              get AI-assisted guidance whenever you need it.
            </p>
          </div>
          <Link
            href="/patient/book"
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/25"
          >
            <CalendarPlus className="h-4 w-4" />
            Book Appointment
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          : kpis.map((k) => {
              const Icon = k.icon;
              return (
                <Link
                  key={k.label}
                  href={k.href}
                  className="group flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md"
                >
                  <span className={cn("inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", k.color)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-2xl font-bold tracking-tight text-foreground">{k.value}</span>
                    <span className="block text-xs font-medium text-muted-foreground">{k.label}</span>
                  </span>
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                </Link>
              );
            })}
      </div>

      {/* Main columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming appointments */}
        <section className="rounded-2xl border bg-card shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              Upcoming Appointments
            </h2>
            <Link href="/patient/appointments" className="text-xs font-medium text-blue-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="divide-y">
            {appointments === null ? (
              <div className="space-y-2 p-5">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : upcoming.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <p className="font-medium text-foreground">No upcoming appointments</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Book an appointment with a doctor to get started.
                </p>
                <Link
                  href="/patient/book"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Book now
                </Link>
              </div>
            ) : (
              upcoming.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-muted/40">
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                    <span className="text-sm font-bold leading-none">{new Date(a.appointment_date).getDate()}</span>
                    <span className="text-[10px] font-medium leading-none">
                      {new Date(a.appointment_date).toLocaleDateString(undefined, { month: "short" })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {a.doctor?.full_name ?? `Doctor #${a.doctor_id}`}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.appointment_time} · {a.reason || "Consultation"}
                    </p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", statusStyles[a.status] ?? "bg-muted text-muted-foreground")}>
                    {a.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* AI assistant card */}
        <section className="flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br from-teal-600/10 via-card to-blue-600/10 shadow-sm">
          <div className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-teal-600" />
              AI Health Assistant
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              Check symptoms, understand diseases, and get medicine guidance —
              powered by AI, reviewed by doctors.
            </p>
          </div>
          <div className="mt-auto space-y-2 p-5 pt-2">
            {[
              { label: "Symptom Checker", href: "/patient/symptom-checker", icon: HeartPulse },
              { label: "Medicine Recommendation", href: "/patient/medicine-recommendation", icon: Pill },
              { label: "Disease Explanation", href: "/patient/disease-explanation", icon: Stethoscope },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl border bg-card/70 px-4 py-3 text-sm font-medium text-foreground transition hover:border-teal-500/40 hover:bg-card"
                >
                  <Icon className="h-4 w-4 text-teal-600" />
                  {item.label}
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-teal-600" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}