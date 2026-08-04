"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

import { getDoctorPatients } from "@/services/users";
import { getPatientReports, type ReportRecord } from "@/services/doctorReports";
import { toApiError } from "@/services/api";

export default function DoctorReportsPage() {
  const [patients, setPatients] = useState<{ id: number; full_name: string }[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDoctorPatients()
      .then((users) =>
        setPatients(users.map((u) => ({ id: u.id, full_name: u.full_name }))),
      )
      .catch((err) => setError(toApiError(err).message));
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
      setReports(data);
    } catch (err) {
      setError(toApiError(err).message);
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Patient Reports</h1>

      <div className="max-w-md space-y-2">
        <label htmlFor="patient" className="text-sm font-medium">
          Select Patient
        </label>
        <select
          id="patient"
          value={selectedPatient}
          onChange={(e) => {
            setSelectedPatient(e.target.value);
            loadReports(e.target.value);
          }}
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose a patient…</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.full_name} (ID {patient.id})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {loadingReports ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      ) : selectedPatient ? (
        reports.length === 0 ? (
          <div className="rounded-xl bg-card p-10 text-center ring-1 ring-foreground/10">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No reports found for this patient.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-card shadow ring-1 ring-foreground/10">
            <table className="w-full min-w-max">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-4 text-left" scope="col">Title</th>
                  <th className="p-4 text-left" scope="col">File</th>
                  <th className="p-4 text-left" scope="col">Type</th>
                  <th className="p-4 text-left" scope="col">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b">
                    <td className="p-4 font-medium">{report.title}</td>
                    <td className="p-4">{report.file_name}</td>
                    <td className="p-4 uppercase">{report.file_type}</td>
                    <td className="p-4">
                      {new Date(report.uploaded_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="rounded-xl bg-card p-10 text-center ring-1 ring-foreground/10">
          <p className="text-muted-foreground">
            Select a patient to view their medical reports.
          </p>
        </div>
      )}
    </div>
  );
}
