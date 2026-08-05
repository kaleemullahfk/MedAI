"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";

import { getAdminAnalytics, type AnalyticsResponse } from "@/services/admin";
import { toApiError } from "@/services/api";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

const METRICS = [
  { key: "new_users", label: "New Users", color: "#3b82f6" },
  { key: "appointments", label: "Appointments", color: "#10b981" },
  { key: "reports", label: "Reports", color: "#f59e0b" },
  { key: "prescriptions", label: "Prescriptions", color: "#8b5cf6" },
  { key: "chats", label: "AI Chats", color: "#ec4899" },
] as const;

function BarChart({
  points,
  label,
  color,
}: {
  points: { date: string; value: number }[];
  label: string;
  color: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const width = 640;
  const height = 140;
  const barGap = 3;
  const barWidth = Math.max(2, Math.floor((width - barGap * points.length) / Math.max(1, points.length)));

  return (
    <div className="rounded-xl bg-card p-5 shadow ring-1 ring-foreground/10">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <span className="h-3 w-3 rounded-sm" style={{ background: color }} />
        {label}
      </h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`${label} over time`}>
        {points.map((p, i) => {
          const barH = Math.round((p.value / max) * (height - 20));
          const x = i * (barWidth + barGap);
          const y = height - barH - 10;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={barH} fill={color} rx={2}>
                <title>{`${p.date}: ${p.value}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-right text-xs text-muted-foreground">
        Total: {points.reduce((s, p) => s + p.value, 0)}
      </p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    let cancelled = false;
    getAdminAnalytics(days)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err).message);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Platform activity over time.</p>
        </div>
        <select
          className="w-full rounded-lg border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-40"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          aria-label="Time range"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {!data ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          {/* Totals */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Doctors", value: data.totals.doctors },
              { label: "Patients", value: data.totals.patients },
              { label: "Admins", value: data.totals.admins },
              { label: "Appointments", value: data.totals.appointments },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-card p-5 text-center shadow ring-1 ring-foreground/10">
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            {METRICS.map((m) => (
              <BarChart
                key={m.key}
                label={m.label}
                color={m.color}
                points={data.series.map((p) => ({
                  date: p.date,
                  value: p[m.key],
                }))}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            Data from PostgreSQL · {data.days} day window
          </div>
        </>
      )}
    </div>
  );
}
