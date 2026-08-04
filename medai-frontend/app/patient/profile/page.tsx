"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";

import { getPatientProfile } from "@/services/patientProfile";
import { toApiError } from "@/services/api";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

interface PatientProfile {
  id: number;
  user_id: number;
  age: number;
  gender: string;
  phone: string;
  address: string;
  blood_group: string;
  height: string;
  weight: string;
  medical_history: string;
  allergies: string;
}

export default function PatientProfilePage() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPatientProfile()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err).message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Patient Profile</h1>

      {!profile ? (
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="rounded-xl bg-card p-8 shadow ring-1 ring-foreground/10">
          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/15 text-blue-600">
              <UserRound className="h-6 w-6" />
            </span>
            <h2 className="text-xl font-semibold">Personal Information</h2>
          </div>

          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">Age</dt>
              <dd>{profile.age}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">Gender</dt>
              <dd>{profile.gender}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">Phone</dt>
              <dd>{profile.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">Blood Group</dt>
              <dd>{profile.blood_group}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">Height</dt>
              <dd>{profile.height || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">Weight</dt>
              <dd>{profile.weight || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-semibold text-muted-foreground">Address</dt>
              <dd>{profile.address || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-semibold text-muted-foreground">Medical History</dt>
              <dd>{profile.medical_history || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-semibold text-muted-foreground">Allergies</dt>
              <dd>{profile.allergies || "—"}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
