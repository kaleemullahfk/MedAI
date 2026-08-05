"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  CheckCircle2,
  Download,
  Trash2,
  ClipboardCopy,
  AlertTriangle,
  HeartPulse,
  Activity,
  ListChecks,
  Utensils,
  Sparkles,
} from "lucide-react";

import {
  uploadReport,
  getMyReports,
  deleteReport,
  downloadReport,
  parseAnalysis,
  type ReportRecord,
  type ReportAnalysis,
} from "@/services/report";
import { toApiError } from "@/services/api";
import { FileUploadCard } from "@/components/upload/FileUploadCard";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

function SectionCard({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[] | undefined;
}) {
  return (
    <div className="rounded-xl bg-card p-5 shadow ring-1 ring-foreground/10">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">{icon}{title}</h3>
      {items && items.length > 0 ? (
        <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">None detected.</p>
      )}
    </div>
  );
}

const riskColor: Record<string, string> = {
  Low: "bg-green-100 text-green-700",
  Moderate: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-700",
};

export default function MedicalReportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportAnalysis | null>(null);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyReports()
      .then((data) => {
        if (!cancelled) setReports(data);
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err).message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = async (f: File) => {
    setFile(f);
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const record = await uploadReport(f);
      setResult(parseAnalysis(record.ai_analysis));
      setReports((prev) => [record, ...prev]);
      setFile(null);
      toast.success("Report analyzed successfully.");
    } catch (err) {
      setError(toApiError(err).message);
      toast.error(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: number, fileName: string) => {
    try {
      const blob = await downloadReport(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success("Report deleted.");
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Could not copy.");
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">AI Medical Report Analyzer</h1>
      <p className="-mt-4 text-muted-foreground">
        Upload a report to get a structured medical summary with risk assessment.
      </p>

      {error && <ErrorState message={error} onRetry={() => file && handleUpload(file)} />}

      <FileUploadCard
        accept=".pdf,.png,.jpg,.jpeg"
        label="Upload Medical Report"
        hint="Supported: PDF • PNG • JPG • JPEG"
        onFile={handleUpload}
        busy={loading}
        busyLabel="Analyzing report…"
      />

      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6">
          {/* Risk banner */}
          {result.emergency_warning ? (
            <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-5 dark:bg-red-950/30">
              <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
              <div>
                <p className="font-semibold text-red-700">Urgent attention needed</p>
                <p className="text-sm text-red-600">{result.emergency_warning}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-green-300 bg-green-50 p-5 dark:bg-green-950/30">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
              <p className="font-semibold text-green-700">No critical findings</p>
            </div>
          )}

          {/* Summary + risk */}
          <div className="rounded-xl bg-card p-6 shadow ring-1 ring-foreground/10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Health Summary
              </h2>
              {result.risk_level && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskColor[result.risk_level] ?? "bg-gray-100 text-gray-700"}`}>
                  Risk: {result.risk_level}
                </span>
              )}
            </div>
            <p className="leading-7 text-muted-foreground">
              {result.summary || "No summary available."}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SectionCard title="Abnormal Findings" icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} items={result.abnormal_findings ?? result.abnormal_values} />
            <SectionCard title="Possible Diseases" icon={<HeartPulse className="h-5 w-5 text-blue-500" />} items={result.possible_diseases} />
            <SectionCard title="Recommendations" icon={<ListChecks className="h-5 w-5 text-emerald-500" />} items={result.recommendations} />
            <SectionCard title="Lifestyle Advice" icon={<Utensils className="h-5 w-5 text-orange-500" />} items={result.lifestyle_advice} />
            <SectionCard title="Exercise Advice" icon={<Activity className="h-5 w-5 text-violet-500" />} items={result.exercise_advice} />
          </div>

          {result.follow_up && (
            <div className="rounded-xl bg-blue-50 p-5 ring-1 ring-blue-200 dark:bg-blue-950/20 dark:ring-blue-800">
              <h3 className="mb-1 font-semibold">Follow-up</h3>
              <p className="text-sm text-muted-foreground">{result.follow_up}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={copyResult}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              <ClipboardCopy className="h-4 w-4" />
              Copy Analysis
            </button>
          </div>
        </div>
      )}

      {/* Previous reports */}
      {reports.length > 0 && (
        <div className="rounded-2xl bg-card p-8 shadow-lg ring-1 ring-foreground/10">
          <h2 className="mb-4 text-2xl font-bold">Previous Reports</h2>
          <ul className="space-y-2">
            {reports.map((report) => (
              <li
                key={report.id}
                className="flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">{report.title || report.file_name}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(report.uploaded_at).toLocaleDateString()}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(report.id, report.file_name)}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium transition hover:bg-muted"
                    title="Download report"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-3 py-1.5 text-sm font-medium text-destructive transition hover:bg-destructive/10"
                    title="Delete report"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
