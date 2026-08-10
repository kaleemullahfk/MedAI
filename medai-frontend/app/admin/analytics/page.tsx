"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  Stethoscope,
  CalendarDays,
  FileText,
  Pill,
  Brain,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import {
  getAdminAnalytics,
  type AnalyticsResponse,
  type Insight,
} from "@/services/admin";
import { toApiError } from "@/services/api";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Small chart helpers (real data, no fabrication)
// ---------------------------------------------------------------------------
function BarChart({
  points,
  label,
  color,
}: {
  points: { label: string; value: number }[];
  label: string;
  color: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
          {label}
        </h3>
      </div>
      {points.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <div className="flex items-end gap-1.5 p-4" style={{ height: 160 }}>
          {points.map((p, i) => {
            const h = Math.max(4, Math.round((p.value / max) * 130));
            return (
              <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${p.label}: ${p.value}`}>
                <span className="text-[10px] font-semibold text-muted-foreground">{p.value}</span>
                <div className="w-full rounded-t-md" style={{ height: h, background: color }} />
                <span className="max-w-full truncate text-[9px] text-muted-foreground">{p.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Donut({
  data,
  label,
}: {
  data: { label: string; count: number }[];
  label: string;
}) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const colors = ["#2563EB", "#14B8A6", "#F59E0B", "#EF4444", "#8B5CF6", "#10B981"];
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  // Precompute each segment's dash + offset without mutating during render.
  const segments = data.reduce<{ dash: number; offset: number }[]>(
    (acc, d) => {
      const dash = (d.count / total) * circumference;
      const offset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
      acc.push({ dash, offset });
      return acc;
    },
    [],
  );

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      </div>
      <div className="flex items-center gap-4 p-4">
        <svg width={140} height={140} viewBox="0 0 140 140" role="img" aria-label={`${label} distribution`} className="shrink-0">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--color-muted)" strokeWidth="16" />
          {data.map((d, i) => {
            const seg = segments[i];
            return (
              <circle
                key={i}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth="16"
                strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
                strokeDashoffset={-seg.offset}
                strokeLinecap="butt"
              />
            );
          })}
          <text x="70" y="66" textAnchor="middle" className="fill-foreground" style={{ fontSize: 22, fontWeight: 700 }}>
            {data.reduce((s, d) => s + d.count, 0)}
          </text>
          <text x="70" y="82" textAnchor="middle" style={{ fontSize: 10 }} className="fill-muted-foreground">
            total
          </text>
        </svg>
        <div className="min-w-0 flex-1 space-y-1.5">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: colors[i % colors.length] }} />
              <span className="truncate text-foreground">{d.label}</span>
              <span className="ml-auto font-semibold text-muted-foreground">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InsightCard({ icon, insight }: { icon: React.ReactNode; insight: Insight }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{insight.label}</p>
        <p className="truncate text-sm font-semibold text-foreground">{insight.value}</p>
      </div>
    </div>
  );
}

const activityIcon: Record<string, React.ReactNode> = {
  user: <Users className="h-4 w-4" />,
  appointment: <CalendarDays className="h-4 w-4" />,
  report: <FileText className="h-4 w-4" />,
  prescription: <Pill className="h-4 w-4" />,
};

const activityColor: Record<string, string> = {
  user: "bg-blue-500/10 text-blue-600",
  appointment: "bg-amber-500/10 text-amber-600",
  report: "bg-teal-500/10 text-teal-600",
  prescription: "bg-violet-500/10 text-violet-600",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [reloadBump, setReloadBump] = useState(0);
  const retry = () => {
    setAnalytics(null);
    setReloadBump((n) => n + 1);
  };

  useEffect(() => {
    let cancelled = false;
    getAdminAnalytics(days)
      .then((d) => {
        if (!cancelled) {
          setAnalytics(d);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err).message);
      });
    return () => {
      cancelled = true;
    };
  }, [days, reloadBump]);

  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-8">
        <ErrorState message="We couldn't load platform analytics right now." onRetry={retry} />
      </div>
    );
  }

  const ov = analytics?.overview;
  const appt = analytics?.appointments;

  const kpis = [
    { label: "Patients", value: ov?.total_patients ?? 0, icon: Users, tint: "text-blue-600 bg-blue-500/10" },
    { label: "Doctors", value: ov?.total_doctors ?? 0, icon: Stethoscope, tint: "text-teal-600 bg-teal-500/10" },
    { label: "Appointments", value: ov?.total_appointments ?? 0, icon: CalendarDays, tint: "text-amber-600 bg-amber-500/10" },
    { label: "Today's Appointments", value: ov?.today_appointments ?? 0, icon: CalendarDays, tint: "text-blue-600 bg-blue-500/10" },
    { label: "Pending", value: ov?.pending_appointments ?? 0, icon: Activity, tint: "text-amber-600 bg-amber-500/10" },
    { label: "Completed", value: ov?.completed_appointments ?? 0, icon: CheckCircle2, tint: "text-emerald-600 bg-emerald-500/10" },
    { label: "Cancelled", value: ov?.cancelled_appointments ?? 0, icon: AlertTriangle, tint: "text-red-600 bg-red-500/10" },
    { label: "Reports", value: ov?.total_reports ?? 0, icon: FileText, tint: "text-teal-600 bg-teal-500/10" },
    { label: "Prescriptions", value: ov?.total_prescriptions ?? 0, icon: Pill, tint: "text-violet-600 bg-violet-500/10" },
    { label: "AI Analyses", value: ov?.total_ai_analyses ?? 0, icon: Brain, tint: "text-blue-600 bg-blue-500/10" },
    { label: "AI Prescriptions", value: ov?.total_ai_prescriptions ?? 0, icon: Brain, tint: "text-teal-600 bg-teal-500/10" },
    { label: "Active Today", value: ov?.active_users_today ?? 0, icon: Users, tint: "text-emerald-600 bg-emerald-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Platform activity {analytics ? `· ${analytics.range.start} → ${analytics.range.end}` : ""}
          </p>
        </div>
        <select
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 sm:w-44"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          aria-label="Time range"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {!analytics ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-60 rounded-xl" />
            <Skeleton className="h-60 rounded-xl" />
          </div>
        </>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
                  <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${k.tint}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xl font-bold tracking-tight text-foreground">{k.value}</p>
                    <p className="truncate text-xs font-medium text-muted-foreground">{k.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Growth */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Appointment growth (prev period)", v: ov?.growth.appointments ?? 0 },
              { label: "Patient growth (prev period)", v: ov?.growth.patients ?? 0 },
              { label: "Report growth (prev period)", v: ov?.growth.reports ?? 0 },
            ].map((g) => (
              <div key={g.label} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-sm">
                <span className="text-sm text-muted-foreground">{g.label}</span>
                <span className={`inline-flex items-center gap-1 text-sm font-bold ${g.v >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  <TrendingUp className="h-4 w-4" />
                  {g.v}%
                </span>
              </div>
            ))}
          </div>

          {/* Charts row 1 */}
          <div className="grid gap-4 lg:grid-cols-2">
            <BarChart
              label="Daily appointments"
              color="#2563EB"
              points={(appt?.daily ?? []).map((d) => ({ label: d.date.slice(5), value: d.count }))}
            />
            <Donut label="Appointment status" data={appt?.status ?? []} />
          </div>

          {/* Charts row 2 */}
          <div className="grid gap-4 lg:grid-cols-2">
            <BarChart
              label="AI risk distribution"
              color="#8B5CF6"
              points={(analytics.ai.risk_distribution ?? []).map((r) => ({ label: r.label, value: r.count }))}
            />
            <BarChart
              label="Most prescribed medicines"
              color="#14B8A6"
              points={(analytics.prescriptions.most_medicines ?? []).map((m) => ({ label: m.label, value: m.count }))}
            />
          </div>

          {/* Smart insights */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Smart Insights</h2>
            {analytics.insights.length === 0 ? (
              <p className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">No insights yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {analytics.insights.map((ins, i) => (
                  <InsightCard
                    key={i}
                    icon={<TrendingUp className="h-4 w-4" />}
                    insight={ins}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Recent activity */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Recent Activity</h2>
            {analytics.recent_activity.length === 0 ? (
              <p className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-card">
                {analytics.recent_activity.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t" : ""}`}>
                    <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activityColor[r.type] ?? "bg-muted text-muted-foreground"}`}>
                      {activityIcon[r.type] ?? <Activity className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{r.action}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.name}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(r.time).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            All figures are computed live from PostgreSQL · {analytics.range.days} day window
          </p>
        </>
      )}
    </div>
  );
}