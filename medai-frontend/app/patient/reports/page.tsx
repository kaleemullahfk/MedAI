"use client";

import { useEffect, useState } from "react";
import { Upload, FileText, CheckCircle2, Loader2 } from "lucide-react";

import {
  uploadReport,
  getMyReports,
  parseAnalysis,
  type ReportRecord,
  type ReportAnalysis,
} from "@/services/report";
import { toApiError } from "@/services/api";

export default function MedicalReportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportAnalysis | null>(null);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyReports()
      .then(setReports)
      .catch((err) => setError(toApiError(err).message));
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a report.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const record = await uploadReport(file);
      setResult(parseAnalysis(record.ai_analysis));
      setReports((prev) => [record, ...prev]);
      setFile(null);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">AI Medical Report Analyzer</h1>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Upload Card */}
      <div className="rounded-2xl bg-card p-8 shadow-lg ring-1 ring-foreground/10">
        <label
          htmlFor="report-upload"
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 p-10 transition-all duration-300 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
        >
          <Upload size={70} className="mb-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-foreground">
            Upload Medical Report
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            Drag &amp; Drop your report here
          </p>
          <p className="mt-1 text-muted-foreground">OR</p>
          <span className="mt-5 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700">
            Choose File
          </span>
          <p className="mt-5 text-sm text-muted-foreground">
            Supported: PDF • PNG • JPG • JPEG
          </p>

          {file && (
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-green-300 bg-green-100 px-5 py-3 text-green-700">
              <CheckCircle2 size={22} />
              <span className="font-medium">{file.name}</span>
            </div>
          )}
        </label>

        <input
          id="report-upload"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="mt-8 w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing Report…
            </span>
          ) : (
            "Upload & Analyze"
          )}
        </button>
      </div>

      {/* AI Result */}
      {result && (
        <div className="space-y-8 rounded-2xl bg-card p-8 shadow-lg ring-1 ring-foreground/10">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <FileText className="text-blue-600" />
              <h2 className="text-2xl font-bold">Summary</h2>
            </div>
            <p className="leading-8 text-muted-foreground">
              {result.summary || "No summary available."}
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold">Abnormal Values</h2>
            {!result.abnormal_values || result.abnormal_values.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-green-300 bg-green-100 p-5 text-green-700">
                <CheckCircle2 size={28} />
                <span className="font-medium">No abnormal values detected.</span>
              </div>
            ) : (
              <ul className="ml-6 list-disc space-y-2">
                {result.abnormal_values.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold">Recommendations</h2>
            {result.recommendations && result.recommendations.length > 0 ? (
              <ul className="ml-6 list-disc space-y-3">
                {result.recommendations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No recommendations available.</p>
            )}
          </div>
        </div>
      )}

      {/* Report history */}
      {reports.length > 0 && (
        <div className="rounded-2xl bg-card p-8 shadow-lg ring-1 ring-foreground/10">
          <h2 className="mb-4 text-2xl font-bold">Previous Reports</h2>
          <ul className="space-y-2">
            {reports.map((report) => (
              <li
                key={report.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <span className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  {report.title || report.file_name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {new Date(report.uploaded_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
