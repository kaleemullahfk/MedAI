"use client";

import { useEffect, useState } from "react";
import { Plus, Pill } from "lucide-react";

import {
  getDoctorPrescriptions,
  createPrescription,
  type PrescriptionRecord,
} from "@/services/prescription";
import { toApiError } from "@/services/api";

export default function DoctorPrescriptionPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [patientId, setPatientId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState("");
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDoctorPrescriptions()
      .then(setPrescriptions)
      .catch((err) => setError(toApiError(err).message))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !diagnosis || !medicines) {
      setError("Patient ID, diagnosis and medicines are required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createPrescription({
        patient_id: Number(patientId),
        diagnosis,
        medicines,
        instructions: instructions || null,
      });
      setPatientId("");
      setDiagnosis("");
      setMedicines("");
      setInstructions("");
      setLoading(true);
      getDoctorPrescriptions()
        .then(setPrescriptions)
        .catch((err) => setError(toApiError(err).message))
        .finally(() => setLoading(false));
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">AI Prescription</h1>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Create prescription */}
      <form
        onSubmit={handleCreate}
        className="space-y-4 rounded-2xl bg-card p-8 shadow-lg ring-1 ring-foreground/10"
      >
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Plus className="h-5 w-5 text-blue-600" />
          New Prescription
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="patientId" className="text-sm font-medium">Patient ID</label>
            <input
              id="patientId"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              type="number"
              placeholder="123"
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="diagnosis" className="text-sm font-medium">Diagnosis</label>
            <input
              id="diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Diagnosis"
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="medicines" className="text-sm font-medium">Medicines</label>
          <textarea
            id="medicines"
            value={medicines}
            onChange={(e) => setMedicines(e.target.value)}
            rows={3}
            placeholder="Medicine name — dosage — frequency"
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="instructions" className="text-sm font-medium">Instructions</label>
          <textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            placeholder="Optional instructions"
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Prescription"}
        </button>
      </form>

      {/* Prescription list */}
      <div className="rounded-2xl bg-card shadow-lg ring-1 ring-foreground/10">
        <div className="border-b p-6">
          <h2 className="text-xl font-bold">Issued Prescriptions</h2>
        </div>

        {loading ? (
          <div className="h-40 animate-pulse bg-muted" />
        ) : prescriptions.length === 0 ? (
          <div className="p-10 text-center">
            <Pill className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No prescriptions issued yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-muted">
                <tr>
                  <th className="p-4 text-left" scope="col">ID</th>
                  <th className="p-4 text-left" scope="col">Patient</th>
                  <th className="p-4 text-left" scope="col">Diagnosis</th>
                  <th className="p-4 text-left" scope="col">Medicines</th>
                  <th className="p-4 text-left" scope="col">Date</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((prescription) => (
                  <tr key={prescription.id} className="border-b">
                    <td className="p-4">{prescription.id}</td>
                    <td className="p-4 font-medium">
                      {prescription.patient?.full_name ?? `Patient #${prescription.patient_id}`}
                    </td>
                    <td className="p-4">{prescription.diagnosis}</td>
                    <td className="max-w-xs truncate p-4">{prescription.medicines}</td>
                    <td className="p-4">
                      {new Date(prescription.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
