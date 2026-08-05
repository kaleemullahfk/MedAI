"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Search,
  Download,
  Eye,
  Trash2,
  Users,
  Loader2,
  ChevronDown,
} from "lucide-react";

import { getDoctorPatients } from "@/services/users";
import {
  getPatientReports,
  type ReportRecord,
} from "@/services/doctorReports";
import { deleteReport, downloadReport } from "@/services/report";
import { safeParseRisk } from "@/lib/reportUtils";
import { toApiError } from "@/services/api";
import ReportDetailModal from "@/components/doctor/ReportDetailModal";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

const riskColor: Record<string, string> = {
  Low: "bg-green-100 text-green-700",
  Moderate: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-700",
};

export default function DoctorReportsPage() {
  const [patients, setPatients] = useState<{ id: number; full_name: string }[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDoctorPatients()
      .then((users) => {
        if (!cancelled)
          setPatients(users.map((u) => ({ id: u.id, full_name: u.full_name })));
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err).message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadReports = async (patientId: string) => {
    if (!patientId) {
      setReports([]);
      return;
    }
    setLoadingReports(true);
    setError(null);
    try {
      const data = await getPatientReports(Number(patientId));
      // Newest first
      setReports([...data].sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()));
    } catch (err) {
      setError(toApiError(err).message);
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return reports.filter((r) => {
      const matchesTerm =
        !term ||
        (r.title ?? "").toLowerCase().includes(term) ||
        (r.file_name ?? "").toLowerCase().includes(term);
      const risk = safeParseRisk(r.ai_analysis);
      const matchesRisk = riskFilter === "all" || risk === riskFilter;
      const matchesType = typeFilter === "all" || r.file_type === typeFilter;
      return matchesTerm && matchesRisk && matchesType;
    });
  }, [reports, search, riskFilter, typeFilter]);

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

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success("Report deleted.");
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  const types = useMemo(() => Array.from(new Set(reports.map((r) => r.file_type))), [reports]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Medical Reports</h1>
        <p className="text-sm text-muted-foreground">
          Review uploaded patient reports, saved AI analysis, and trends.
        </p>
      </div>

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-30 space-y-3 rounded-xl border bg-background/95 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Select patient — custom-styled dark dropdown */}
          <div className="relative lg:w-64">
            <select
              value={selectedPatient}
              onChange={(e) => {
                setSelectedPatient(e.target.value);
                setSearch("");
                setRiskFilter("all");
                setTypeFilter("all");
                loadReports(e.target.value);
              }}
              className="w-full appearance-none rounded-lg border border-border bg-[#111827] px-4 py-2.5 text-sm text-white shadow-sm outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-[#111827] dark:text-white [&>option]:bg-[#111827] [&>option]:text-white [&>option]:hover:bg-blue-600"
              aria-label="Select patient"
            >
              <option value="" className="bg-[#111827] text-white">
                Choose a patient…
              </option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id} className="bg-[#111827] text-white">
                  {patient.full_name} (ID {patient.id})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Search */}
          {selectedPatient && (
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports…"
                className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Filters */}
          {selectedPatient && reports.length > 0 && (
            <>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border bg-[#111827] px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 [&>option]:bg-[#111827] [&>option]:text-white lg:w-40"
                aria-label="Filter by risk"
              >
                <option value="all">All risk</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border bg-[#111827] px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 [&>option]:bg-[#111827] [&>option]:text-white lg:w-40"
                aria-label="Filter by type"
              >
                <option value="all">All types</option>
                {types.map((t) => (
                  <option key={t} value={t} className="bg-[#111827] text-white">
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={() => loadReports(selectedPatient)} />}

      {/* Content */}
      {!selectedPatient ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Select a patient"
          description="Choose a patient from the dropdown to view their uploaded reports."
        />
      ) : loadingReports ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title={reports.length === 0 ? "No reports yet" : "No matching reports"}
          description={
            reports.length === 0
              ? "This patient has not uploaded any reports."
              : "Try a different search or filter."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((report) => {
            const risk = safeParseRisk(report.ai_analysis);
            return (
              <div
                key={report.id}
                className="group overflow-hidden rounded-2xl bg-card shadow ring-1 ring-foreground/10 transition hover:shadow-lg"
              >
                {/* Thumbnail area */}
                <button
                  onClick={() => setSelectedReport(report.id)}
                  className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40"
                  aria-label={`View ${report.title}`}
                >
                  <FileText className="h-10 w-10 text-blue-600/60" />
                </button>

                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{report.title}</h3>
                    {risk && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${riskColor[risk] ?? "bg-gray-100 text-gray-700"}`}>
                        {risk}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {report.file_name} · {report.file_type?.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Uploaded {new Date(report.uploaded_at).toLocaleDateString()}
                  </p>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setSelectedReport(report.id)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(report.id, report.file_name)}
                      className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-muted"
                      aria-label="Download report"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      disabled={busyId === report.id}
                      className="inline-flex items-center justify-center rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                      aria-label="Delete report"
                    >
                      {busyId === report.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedReport && (
        <ReportDetailModal reportId={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  );
}
