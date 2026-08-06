"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pill,
  Sparkles,
  Loader2,
  Check,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  Save,
} from "lucide-react";

import {
  getDoctorPrescriptions,
  generateAiPrescription,
  createPrescription,
  updatePrescription,
  approvePrescription,
  deletePrescription,
  downloadPrescriptionPdf,
  parseMedicines,
  type PrescriptionRecord,
  type MedicineItem,
} from "@/services/prescription";
import { getDoctorPatients } from "@/services/users";
import { getPatientReports } from "@/services/doctorReports";
import { toApiError } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

interface PatientOpt {
  id: number;
  full_name: string;
}

interface ReportOpt {
  id: number;
  title: string;
}

const emptyMeds: MedicineItem[] = [{ medicine: "", strength: "", dosage: "", frequency: "", duration: "", route: "", instructions: "" }];

export default function DoctorPrescriptionPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [patientId, setPatientId] = useState("");
  const [reportId, setReportId] = useState("");
  const [patients, setPatients] = useState<PatientOpt[]>([]);
  const [reports, setReports] = useState<ReportOpt[]>([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [severity, setSeverity] = useState("");
  const [clinicalFindings, setClinicalFindings] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [medicines, setMedicines] = useState<MedicineItem[]>(emptyMeds);
  const [lifestyleAdvice, setLifestyleAdvice] = useState("");
  const [diet, setDiet] = useState("");
  const [exercise, setExercise] = useState("");
  const [hydration, setHydration] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [labTests, setLabTests] = useState("");
  const [emergencyWarnings, setEmergencyWarnings] = useState("");
  const [interactions, setInteractions] = useState("");
  const [notes, setNotes] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const [confirmApproveId, setConfirmApproveId] = useState<number | null>(null);

  const load = () => {
    getDoctorPrescriptions()
      .then(setPrescriptions)
      .catch((err) => setError(toApiError(err).message));
  };

  useEffect(() => {
    getDoctorPrescriptions()
      .then(setPrescriptions)
      .catch((err) => setError(toApiError(err).message));
    getDoctorPatients()
      .then((u) => setPatients(u.map((x) => ({ id: x.id, full_name: x.full_name }))))
      .catch(() => undefined);
  }, []);

  const resetForm = () => {
    setEditId(null);
    setPatientId("");
    setReportId("");
    setDiagnosis("");
    setSeverity("");
    setClinicalFindings("");
    setAiSummary("");
    setMedicines(emptyMeds);
    setLifestyleAdvice("");
    setDiet("");
    setExercise("");
    setHydration("");
    setFollowUp("");
    setLabTests("");
    setEmergencyWarnings("");
    setInteractions("");
    setNotes("");
  };

  const loadPatientReports = async (pid: string) => {
    if (!pid) {
      setReports([]);
      return;
    }
    try {
      const data = await getPatientReports(Number(pid));
      setReports(data.map((r) => ({ id: r.id, title: r.title || r.file_name })));
    } catch {
      setReports([]);
    }
  };

  const handleGenerate = async () => {
    if (!reportId) {
      toast.error("Select a report to generate from.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const created = await generateAiPrescription(Number(reportId));
      toast.success("AI draft generated. Review and edit before approving.");
      // Load the draft into the form.
      setEditId(created.id);
      setPatientId(String(created.patient_id));
      setDiagnosis(created.diagnosis ?? "");
      setSeverity(created.severity ?? "");
      setClinicalFindings(created.clinical_findings ?? "");
      setAiSummary(created.ai_summary ?? "");
      setMedicines(parseMedicines(created.medicines));
      setLifestyleAdvice(created.lifestyle_advice ?? "");
      setDiet(created.diet_recommendations ?? "");
      setExercise(created.exercise_recommendations ?? "");
      setHydration(created.hydration_advice ?? "");
      setFollowUp(created.follow_up ?? "");
      setLabTests(created.lab_tests ?? "");
      setEmergencyWarnings(created.emergency_warnings ?? "");
      setInteractions(created.interactions ?? "");
      setNotes(created.notes ?? "");
      setReportId(String(created.report_id ?? ""));
      load();
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !diagnosis) {
      toast.error("Patient and diagnosis are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload: Record<string, unknown> = {
      patient_id: Number(patientId),
      report_id: reportId ? Number(reportId) : null,
      diagnosis,
      severity: severity || null,
      clinical_findings: clinicalFindings || null,
      ai_summary: aiSummary || null,
      medicines: JSON.stringify(medicines),
      lifestyle_advice: lifestyleAdvice || null,
      diet_recommendations: diet || null,
      exercise_recommendations: exercise || null,
      hydration_advice: hydration || null,
      follow_up: followUp || null,
      lab_tests: labTests || null,
      emergency_warnings: emergencyWarnings || null,
      interactions: interactions || null,
      notes: notes || null,
    };
    try {
      if (editId) {
        await updatePrescription(editId, payload);
        toast.success("Prescription draft updated (autosaved).");
      } else {
        await createPrescription({ ...payload, status: "draft" });
        toast.success("Prescription draft saved.");
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: number) => {
    setSaving(true);
    try {
      const updated = await approvePrescription(id);
      toast.success(`Prescription ${updated.id} approved.`);
      setConfirmApproveId(null);
      load();
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this prescription? This cannot be undone.")) return;
    try {
      await deletePrescription(id);
      toast.success("Prescription deleted.");
      load();
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

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

  const editRecord = (r: PrescriptionRecord) => {
    if (r.status === "approved") {
      toast.error("Approved prescriptions cannot be edited.");
      return;
    }
    setEditId(r.id);
    setPatientId(String(r.patient_id));
    setReportId(String(r.report_id ?? ""));
    setDiagnosis(r.diagnosis ?? "");
    setSeverity(r.severity ?? "");
    setClinicalFindings(r.clinical_findings ?? "");
    setAiSummary(r.ai_summary ?? "");
    setMedicines(parseMedicines(r.medicines));
    setLifestyleAdvice(r.lifestyle_advice ?? "");
    setDiet(r.diet_recommendations ?? "");
    setExercise(r.exercise_recommendations ?? "");
    setHydration(r.hydration_advice ?? "");
    setFollowUp(r.follow_up ?? "");
    setLabTests(r.lab_tests ?? "");
    setEmergencyWarnings(r.emergency_warnings ?? "");
    setInteractions(r.interactions ?? "");
    setNotes(r.notes ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      draft: "bg-amber-100 text-amber-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[s] ?? "bg-gray-100 text-gray-700"}`}>
        {s}
      </span>
    );
  };

  const totalPrescriptions = prescriptions ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">AI Prescription</h1>
      <p className="-mt-4 text-muted-foreground">
        Generate an AI draft from a patient&apos;s report, review, edit, and approve.
      </p>

      {error && <ErrorState message={error} />}

      {/* AI generate */}
      <div className="rounded-2xl bg-card p-6 shadow-lg ring-1 ring-foreground/10">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Sparkles className="h-5 w-5 text-violet-600" />
          Generate AI Prescription
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a patient, then a report — the AI builds a draft from the report&apos;s saved analysis.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="gen-patient">Patient</Label>
            <select
              id="gen-patient"
              value={patientId}
              onChange={(e) => {
                setPatientId(e.target.value);
                loadPatientReports(e.target.value);
              }}
              className="w-full rounded-lg border bg-[#111827] px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 [&>option]:bg-[#111827] [&>option]:text-white"
            >
              <option value="">Select patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen-report">Report</Label>
            <select
              id="gen-report"
              value={reportId}
              onChange={(e) => setReportId(e.target.value)}
              className="w-full rounded-lg border bg-[#111827] px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 [&>option]:bg-[#111827] [&>option]:text-white"
            >
              <option value="">Select report…</option>
              {reports.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleGenerate} disabled={generating || !reportId} className="w-full">
              {generating ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Generate Draft
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Create / edit form */}
      <form onSubmit={handleSave} className="space-y-5 rounded-2xl bg-card p-8 shadow-lg ring-1 ring-foreground/10">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          {editId ? (
            <>
              <RefreshCw className="h-5 w-5 text-blue-600" /> Editing Draft #{editId}
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 text-blue-600" /> New Prescription
            </>
          )}
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="patientId">Patient ID</Label>
            <Input id="patientId" type="number" value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Patient ID" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <select id="severity" value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">—</option>
              <option>Low</option>
              <option>Moderate</option>
              <option>High</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reportRef">Report Reference</Label>
            <Input id="reportRef" type="number" value={reportId} onChange={(e) => setReportId(e.target.value)} placeholder="Report ID (optional)" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="diagnosis">Diagnosis</Label>
          <Input id="diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Primary diagnosis" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="clinicalFindings">Clinical Findings</Label>
            <textarea id="clinicalFindings" value={clinicalFindings} onChange={(e) => setClinicalFindings(e.target.value)} rows={3} className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aiSummary">AI Summary</Label>
            <textarea id="aiSummary" value={aiSummary} onChange={(e) => setAiSummary(e.target.value)} rows={3} className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Medicines */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">Medicines</Label>
            <button
              type="button"
              onClick={() => setMedicines((m) => [...m, { medicine: "", strength: "", dosage: "", frequency: "", duration: "", route: "", instructions: "" }])}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" /> Add medicine
            </button>
          </div>
          {medicines.map((med, i) => (
            <div key={i} className="grid gap-2 rounded-lg border p-3 md:grid-cols-7">
              <Input placeholder="Medicine" value={med.medicine} onChange={(e) => setMedicines((m) => m.map((x, j) => (j === i ? { ...x, medicine: e.target.value } : x)))} />
              <Input placeholder="Strength" value={med.strength} onChange={(e) => setMedicines((m) => m.map((x, j) => (j === i ? { ...x, strength: e.target.value } : x)))} />
              <Input placeholder="Dosage" value={med.dosage} onChange={(e) => setMedicines((m) => m.map((x, j) => (j === i ? { ...x, dosage: e.target.value } : x)))} />
              <Input placeholder="Frequency" value={med.frequency} onChange={(e) => setMedicines((m) => m.map((x, j) => (j === i ? { ...x, frequency: e.target.value } : x)))} />
              <Input placeholder="Duration" value={med.duration} onChange={(e) => setMedicines((m) => m.map((x, j) => (j === i ? { ...x, duration: e.target.value } : x)))} />
              <Input placeholder="Route" value={med.route} onChange={(e) => setMedicines((m) => m.map((x, j) => (j === i ? { ...x, route: e.target.value } : x)))} />
              <div className="flex gap-1">
                <Input placeholder="Instructions" value={med.instructions} onChange={(e) => setMedicines((m) => m.map((x, j) => (j === i ? { ...x, instructions: e.target.value } : x)))} />
                {medicines.length > 1 && (
                  <button type="button" onClick={() => setMedicines((m) => m.filter((_, j) => j !== i))} className="shrink-0 rounded-md border px-2 text-red-500 hover:bg-destructive/10" aria-label="Remove medicine">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lifestyleAdvice">Lifestyle Advice</Label>
            <textarea id="lifestyleAdvice" value={lifestyleAdvice} onChange={(e) => setLifestyleAdvice(e.target.value)} rows={2} className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="diet">Diet Recommendations</Label>
            <textarea id="diet" value={diet} onChange={(e) => setDiet(e.target.value)} rows={2} className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exercise">Exercise</Label>
            <textarea id="exercise" value={exercise} onChange={(e) => setExercise(e.target.value)} rows={2} className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hydration">Hydration</Label>
            <textarea id="hydration" value={hydration} onChange={(e) => setHydration(e.target.value)} rows={2} className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="followUp">Follow-up</Label>
            <Input id="followUp" value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="e.g. 2 weeks" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="labTests">Lab Tests</Label>
            <Input id="labTests" value={labTests} onChange={(e) => setLabTests(e.target.value)} placeholder="e.g. Repeat CBC in 1 month" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyWarnings">Emergency Warnings</Label>
            <textarea id="emergencyWarnings" value={emergencyWarnings} onChange={(e) => setEmergencyWarnings(e.target.value)} rows={2} className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interactions">Drug Interactions</Label>
            <textarea id="interactions" value={interactions} onChange={(e) => setInteractions(e.target.value)} rows={2} className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="notes">Doctor Notes</Label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving…</span>
            ) : (
              <span className="inline-flex items-center gap-2"><Save className="h-4 w-4" /> {editId ? "Save Draft (Autosave)" : "Save Prescription"}</span>
            )}
          </Button>
          {editId && (
            <Button type="button" variant="outline" onClick={resetForm}>Cancel Edit</Button>
          )}
        </div>
      </form>

      {/* List */}
      <div className="rounded-2xl bg-card shadow-lg ring-1 ring-foreground/10">
        <div className="border-b p-6">
          <h2 className="text-xl font-bold">Issued Prescriptions</h2>
        </div>

        {prescriptions === null ? (
          <div className="p-6 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
        ) : totalPrescriptions.length === 0 ? (
          <EmptyState icon={<Pill className="h-6 w-6" />} title="No prescriptions yet" description="Generate an AI draft or create one to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-muted">
                <tr>
                  <th className="p-4 text-left" scope="col">ID</th>
                  <th className="p-4 text-left" scope="col">Patient</th>
                  <th className="p-4 text-left" scope="col">Diagnosis</th>
                  <th className="p-4 text-left" scope="col">Status</th>
                  <th className="p-4 text-left" scope="col">Date</th>
                  <th className="p-4 text-left" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {totalPrescriptions.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-4">{p.id}</td>
                    <td className="p-4 font-medium">{p.patient?.full_name ?? `Patient #${p.patient_id}`}</td>
                    <td className="max-w-xs truncate p-4">{p.diagnosis}</td>
                    <td className="p-4">{statusBadge(p.status)}</td>
                    <td className="p-4">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {p.status === "draft" && (
                          <>
                            <button onClick={() => editRecord(p)} className="rounded-md p-2 hover:bg-muted" title="Edit" aria-label="Edit">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={() => setConfirmApproveId(p.id)} className="rounded-md p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30" title="Approve" aria-label="Approve">
                              <Check className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDownload(p.id)} className="rounded-md p-2 hover:bg-muted" title="Download PDF" aria-label="Download">
                          <Download className="h-4 w-4" />
                        </button>
                        {p.status === "draft" && (
                          <button onClick={() => handleDelete(p.id)} className="rounded-md p-2 text-red-500 hover:bg-destructive/10" title="Delete" aria-label="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve confirmation modal */}
      {confirmApproveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" onClick={() => setConfirmApproveId(null)}>
          <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Approve Prescription #{confirmApproveId}?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Once approved, this prescription is final, visible to the patient, and can be printed or downloaded. It can no longer be edited.
            </p>
            <div className="mt-5 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmApproveId(null)}>Cancel</Button>
              <Button className="flex-1" onClick={() => handleApprove(confirmApproveId)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
