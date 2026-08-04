"use client";

import { useEffect, useState } from "react";
import { Stethoscope } from "lucide-react";

import { getDoctorProfile } from "@/services/doctorProfile";
import { toApiError } from "@/services/api";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

interface DoctorProfile {
  id: number;
  user_id: number;
  specialization: string;
  qualification: string;
  experience: number;
  hospital: string;
  consultation_fee: number;
  available_days: string;
  available_time: string;
}

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDoctorProfile()
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
      <h1 className="text-3xl font-bold">Doctor Profile</h1>

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
              <Stethoscope className="h-6 w-6" />
            </span>
            <h2 className="text-xl font-semibold">Professional Information</h2>
          </div>

          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">Specialization</dt>
              <dd className="text-lg font-medium">{profile.specialization}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">Qualification</dt>
              <dd className="text-lg font-medium">{profile.qualification}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">Experience</dt>
              <dd className="text-lg font-medium">{profile.experience} Years</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">Consultation Fee</dt>
              <dd className="text-lg font-medium">Rs. {profile.consultation_fee}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">Hospital</dt>
              <dd className="text-lg font-medium">{profile.hospital}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">Available Days</dt>
              <dd className="text-lg font-medium">{profile.available_days}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-semibold text-muted-foreground">Available Time</dt>
              <dd className="text-lg font-medium">{profile.available_time}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
