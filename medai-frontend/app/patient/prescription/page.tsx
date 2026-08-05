"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ClipboardCopy,
  Download,
  RotateCcw,
  Pill,
  AlertTriangle,
  ShieldAlert,
  HeartPulse,
  ListChecks,
  Sparkles,
} from "lucide-react";

import { analyzePrescription } from "@/services/prescription";
import { toApiError } from "@/services/api";
import { FileUploadCard } from "@/components/upload/FileUploadCard";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

interface PrescriptionResult {
  doctor_name?: string;
  hospital?: string;
  patient_name?: string;
  prescription_date?: string;
  diagnosis?: string;
  medicines?: string[];
  purpose?: string[];
  dosage?: string[];
  frequency?: string[];
  duration?: string[];
  instructions?: string[];
  warnings?: string[];
  interactions?: string[];
  side_effects?: string[];
  missed_dose?: string[];
  lifestyle_recommendations?: string[];
  summary?: string;
}

function ResultCard({
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
            <li key={i}>{item === "Not Available" ? "Not Available" : item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Not Available</p>
      )}
    </div>
  );
}

export default function PrescriptionAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PrescriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (f: File) => {
    setFile(f);
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzePrescription(f);
      setResult(data);
      toast.success("Prescription analyzed successfully.");
    } catch (err) {
      setError(toApiError(err).message);
      toast.error(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    if (!result) return;
    const text = JSON.stringify(result, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Could not copy.");
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const text = JSON.stringify(result, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prescription-analysis.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const meta: { label: string; value: string }[] = [
    { label: "Doctor", value: result?.doctor_name ?? "" },
    { label: "Hospital", value: result?.hospital ?? "" },
    { label: "Patient", value: result?.patient_name ?? "" },
    { label: "Date", value: result?.prescription_date ?? "" },
    { label: "Diagnosis", value: result?.diagnosis ?? "" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">AI Prescription Analyzer</h1>
      <p className="-mt-4 text-muted-foreground">
        Upload a prescription to extract medicines, dosage, warnings, and more.
      </p>

      {error && <ErrorState message={error} onRetry={() => file && handleUpload(file)} />}

      {/* Upload */}
      <FileUploadCard
        accept=".pdf,.png,.jpg,.jpeg"
        label="Upload Prescription"
        hint="Supported: PDF • PNG • JPG • JPEG"
        onFile={handleUpload}
        busy={loading}
        busyLabel="Analyzing prescription…"
      />

      {/* Result */}
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
          {/* Meta */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {meta.map((m) => (
              <div key={m.label} className="rounded-xl bg-card p-4 shadow ring-1 ring-foreground/10">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="mt-1 font-medium">{m.value || "Not Available"}</p>
              </div>
            ))}
          </div>

          {/* Medicines table */}
          <div className="overflow-x-auto rounded-xl bg-card shadow ring-1 ring-foreground/10">
            <h3 className="flex items-center gap-2 border-b p-5 font-semibold">
              <Pill className="h-5 w-5 text-blue-600" />
              Medicines
            </h3>
            <table className="w-full min-w-max">
              <thead className="bg-muted">
                <tr>
                  <th className="p-4 text-left" scope="col">Medicine</th>
                  <th className="p-4 text-left" scope="col">Purpose</th>
                  <th className="p-4 text-left" scope="col">Dosage</th>
                  <th className="p-4 text-left" scope="col">Frequency</th>
                  <th className="p-4 text-left" scope="col">Duration</th>
                  <th className="p-4 text-left" scope="col">Instructions</th>
                </tr>
              </thead>
              <tbody>
                {(result.medicines ?? []).map((med, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-4 font-medium">{med}</td>
                    <td className="p-4 text-sm">{result.purpose?.[i] ?? "Not Available"}</td>
                    <td className="p-4 text-sm">{result.dosage?.[i] ?? "Not Available"}</td>
                    <td className="p-4 text-sm">{result.frequency?.[i] ?? "Not Available"}</td>
                    <td className="p-4 text-sm">{result.duration?.[i] ?? "Not Available"}</td>
                    <td className="p-4 text-sm">{result.instructions?.[i] ?? "Not Available"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <ResultCard title="Warnings" icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} items={result.warnings} />
            <ResultCard title="Drug Interactions" icon={<ShieldAlert className="h-5 w-5 text-red-500" />} items={result.interactions} />
            <ResultCard title="Side Effects" icon={<AlertTriangle className="h-5 w-5 text-orange-500" />} items={result.side_effects} />
            <ResultCard title="Missed Dose" icon={<HeartPulse className="h-5 w-5 text-blue-500" />} items={result.missed_dose} />
            <ResultCard title="Lifestyle" icon={<ListChecks className="h-5 w-5 text-emerald-500" />} items={result.lifestyle_recommendations} />
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-emerald-50 p-6 ring-1 ring-blue-200 dark:from-blue-950/20 dark:to-emerald-950/20 dark:ring-blue-800">
            <h3 className="mb-2 flex items-center gap-2 font-semibold">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Summary
            </h3>
            <p className="text-sm leading-7 text-muted-foreground">
              {result.summary || "Not Available"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={copyResult}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              <ClipboardCopy className="h-4 w-4" />
              Copy Result
            </button>
            <button
              onClick={downloadResult}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Download Report
            </button>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <RotateCcw className="h-4 w-4" />
              Analyze Another Prescription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
