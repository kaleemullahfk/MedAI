"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  X,
  Download,
  FileText,
  AlertTriangle,
  Sparkles,
  HeartPulse,
  ListChecks,
  Utensils,
  Activity,
  TrendingUp,
  UserRound,
  CalendarDays,
  ShieldAlert,
} from "lucide-react";

import { getReportDetail, type ReportDetail } from "@/services/doctorReports";
import { downloadReport } from "@/services/report";
import { toApiError } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

const riskColor: Record<string, string> = {
  Low: "bg-green-100 text-green-700",
  Moderate: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-700",
};

function Section({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items?: string[] | null;
}) {
  return (
    <div className="rounded-xl bg-card p-4 shadow ring-1 ring-foreground/10">
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h4>
      {items && items.length > 0 ? (
        <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">None reported.</p>
      )}
    </div>
  );
}

/** Extract a simple value + unit from a finding string like "Glucose 165 mg/dL (High)". */
function parseFinding(finding: string) {
  const m = finding.match(/^([A-Za-z\s]+?)\s+([\d.]+)\s*([a-zA-Z%/]*)/);
  if (!m) return null;
  return { label: m[1].trim(), value: m[2], unit: m[3].trim() };
}

export default function ReportDetailModal({
  reportId,
  onClose,
}: {
  reportId: number;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getReportDetail(reportId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  const handleDownload = async () => {
    if (!detail) return;
    try {
      const blob = await downloadReport(detail.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = detail.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const analysis = detail?.analysis;
  // For trend analysis: the last few history entries that have a parseable
  // value, shown newest-first.
  const trendItems = (detail?.history ?? [])
    .map((h) => ({ h, a: safeParse(h.ai_analysis) }))
    .filter(({ a }) => !!a.summary || !!a.risk_level);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Report details"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-bold">{detail?.title || "Report"}</h2>
            <p className="text-sm text-muted-foreground">
              {detail?.file_name} · {detail?.file_type?.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-2 hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-2">
          {/* PDF preview */}
          <div className="border-r bg-muted/30 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-blue-600" />
              Original Report
            </h3>
            {loading ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <iframe
                src={`/api${detail?.download_url ?? `/report/download/${reportId}`}`}
                className="h-96 w-full rounded-lg border bg-white"
                title="Report preview"
              />
            )}
          </div>

          {/* Analysis */}
          <div className="overflow-y-auto p-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : error ? (
              <ErrorState message={error} />
            ) : (
              <div className="space-y-5">
                {/* Patient info */}
                <div className="rounded-xl bg-card p-4 shadow ring-1 ring-foreground/10">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <UserRound className="h-4 w-4 text-blue-600" />
                    Patient Information
                  </h4>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Name</dt>
                      <dd className="font-medium">{detail?.patient?.full_name ?? "Not Available"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Patient ID</dt>
                      <dd className="font-medium">{detail?.patient?.id ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Age</dt>
                      <dd className="font-medium">{detail?.patient?.age ?? "Not Available"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Gender</dt>
                      <dd className="font-medium">{detail?.patient?.gender || "Not Available"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="flex items-center gap-1 text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" /> Uploaded
                      </dt>
                      <dd className="font-medium">
                        {detail?.uploaded_at ? new Date(detail.uploaded_at).toLocaleString() : "—"}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Emergency banner */}
                {analysis?.emergency_warning ? (
                  <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 dark:bg-red-950/30">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">Urgent attention needed</p>
                      <p className="text-sm text-red-600">{analysis.emergency_warning}</p>
                    </div>
                  </div>
                ) : null}

                {/* AI summary + risk */}
                <div className="rounded-xl bg-card p-4 shadow ring-1 ring-foreground/10">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-sm font-semibold">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      AI Health Summary
                    </h4>
                    {analysis?.risk_level && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          riskColor[analysis.risk_level] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        Risk: {analysis.risk_level}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {analysis?.summary || "Not Available"}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Section title="Abnormal Findings" icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} items={analysis?.abnormal_findings ?? analysis?.abnormal_values} />
                  <Section title="Possible Diseases" icon={<HeartPulse className="h-4 w-4 text-blue-500" />} items={analysis?.possible_diseases} />
                  <Section title="Recommendations" icon={<ListChecks className="h-4 w-4 text-emerald-500" />} items={analysis?.recommendations} />
                  <Section title="Lifestyle Advice" icon={<Utensils className="h-4 w-4 text-orange-500" />} items={analysis?.lifestyle_advice} />
                  <Section title="Exercise Advice" icon={<Activity className="h-4 w-4 text-violet-500" />} items={analysis?.exercise_advice} />
                </div>

                {analysis?.follow_up ? (
                  <div className="rounded-xl bg-blue-50 p-4 ring-1 ring-blue-200 dark:bg-blue-950/20 dark:ring-blue-800">
                    <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold">
                      <ShieldAlert className="h-4 w-4 text-blue-600" />
                      Follow-up
                    </h4>
                    <p className="text-sm text-muted-foreground">{analysis.follow_up}</p>
                  </div>
                ) : null}

                {/* Trend analysis */}
                {trendItems.length > 1 && (
                  <div className="rounded-xl bg-card p-4 shadow ring-1 ring-foreground/10">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      Trend Analysis
                    </h4>
                    <div className="space-y-2">
                      {trendItems.slice(0, 5).map(({ h, a }) => {
                        const firstFinding = (a.abnormal_findings ?? a.abnormal_values ?? [])[0];
                        const parsed = firstFinding ? parseFinding(firstFinding) : null;
                        return (
                          <div key={h.id} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
                            <span className="text-muted-foreground">
                              {new Date(h.uploaded_at).toLocaleDateString()}
                            </span>
                            <span className="font-medium">
                              {parsed ? `${parsed.label}: ${parsed.value} ${parsed.unit}` : (a.summary ?? "—").slice(0, 60)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function safeParse(raw: string | null | undefined): {
  summary?: string;
  risk_level?: string;
  abnormal_findings?: string[];
  abnormal_values?: string[];
} {
  if (!raw) return {};
  try {
    const d = JSON.parse(raw);
    return d && typeof d === "object" ? d : {};
  } catch {
    return {};
  }
}
