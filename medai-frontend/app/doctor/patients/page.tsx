"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { getDoctorPatients } from "@/services/users";
import { toApiError } from "@/services/api";
import type { User } from "@/types/auth";

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDoctorPatients()
      .then(setPatients)
      .catch((err) => setError(toApiError(err).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Patients</h1>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      ) : patients.length === 0 ? (
        <div className="rounded-xl bg-card p-10 text-center ring-1 ring-foreground/10">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            No patients yet. Patients who book an appointment with you will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card shadow ring-1 ring-foreground/10">
          <table className="w-full min-w-max">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-4 text-left" scope="col">ID</th>
                <th className="p-4 text-left" scope="col">Name</th>
                <th className="p-4 text-left" scope="col">Email</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="border-b">
                  <td className="p-4">{patient.id}</td>
                  <td className="p-4 font-medium">{patient.full_name}</td>
                  <td className="p-4">{patient.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
