"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Pill,
  Download,
  Printer,
  Eye,
  FileText,
  Stethoscope,
} from "lucide-react";

import {
  downloadPrescriptionPdf,
  type PrescriptionRecord,
} from "@/services/prescription";
import { toApiError } from "@/services/api";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

interface PatientRx extends PrescriptionRecord {
  doctor?: { id: number; full_name: string; email: string } | null;
}

export default function MyPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PatientRx[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/prescription/my")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data: PatientRx[]) => {
        if (!cancelled) setPrescriptions(data);
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err).message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDownload = async (id: number) => {
    try {
      const blob = await downloadPrescriptionPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const handlePreview = async (id: number) => {
    try {
      const blob = await downloadPrescriptionPdf(id);
      const url = URL.createObjectURL(blob);
      setPreview(id);
      setPdfUrl(url);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const closePreview = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setPreview(null);
  };

  const approved = (prescriptions ?? []).filter((p) => p.status === "approved");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Prescriptions</h1>
        <p className="text-sm text-muted-foreground">
          View prescriptions issued by your doctor, download or print them.
        </p>
      </div>

      {error && <ErrorState message={error} />}

      {prescriptions === null ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : prescriptions.length === 0 ? (
        <EmptyState
          icon={<Pill className="h-6 w-6" />}
          title="No prescriptions yet"
          description="When your doctor issues and approves a prescription, it will appear here."
        />
      ) : approved.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No approved prescriptions"
          description="Your doctor has not approved any prescriptions yet."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {approved.map((p) => (
            <div key={p.id} className="rounded-2xl bg-card p-6 shadow ring-1 ring-foreground/10">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/15 text-blue-600">
                    <Stethoscope className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="font-semibold">{p.doctor?.full_name ?? "Doctor"}</p>
                    <p className="text-xs text-muted-foreground">
                      Rx #{p.id} · {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                  Approved
                </span>
              </div>

              <p className="font-medium">{p.diagnosis}</p>
              {p.follow_up && (
                <p className="mt-1 text-sm text-muted-foreground">Follow-up: {p.follow_up}</p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handlePreview(p.id)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
                >
                  <Eye className="h-4 w-4" /> View
                </button>
                <button
                  onClick={() => handleDownload(p.id)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-muted"
                >
                  <Download className="h-4 w-4" /> Download
                </button>
                <button
                  onClick={() => handleDownload(p.id).then(() => {})}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-muted"
                  title="Print (open PDF and print)"
                >
                  <Printer className="h-4 w-4" /> Print
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF preview modal */}
      {preview !== null && pdfUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={closePreview}
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-background" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="font-semibold">Prescription #{preview}</h3>
              <button onClick={closePreview} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="Close">
                ✕
              </button>
            </div>
            <iframe src={pdfUrl} className="h-[75vh] w-full" title="Prescription PDF" />
          </div>
        </div>
      )}
    </div>
  );
}
