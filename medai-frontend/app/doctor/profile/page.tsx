"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Stethoscope, Loader2, Pencil, Save } from "lucide-react";

import {
  getDoctorProfile,
  updateDoctorProfile,
  type DoctorProfile,
} from "@/services/doctorProfile";
import { updateMyName } from "@/services/users";
import { useAuth } from "@/hooks/useAuth";
import { toApiError } from "@/services/api";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emptyForm: Partial<DoctorProfile> & { full_name: string } = {
  full_name: "",
  specialization: "",
  qualification: "",
  experience: 0,
  hospital: "",
  consultation_fee: 0,
  available_days: "",
  available_time: "",
  license_number: "",
};

export default function DoctorProfilePage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const syncForm = (data: DoctorProfile, fullName?: string) => {
    setForm({
      full_name: fullName ?? user?.full_name ?? "",
      specialization: data.specialization ?? "",
      qualification: data.qualification ?? "",
      experience: data.experience ?? 0,
      hospital: data.hospital ?? "",
      consultation_fee: data.consultation_fee ?? 0,
      available_days: data.available_days ?? "",
      available_time: data.available_time ?? "",
      license_number: data.license_number ?? "",
    });
  };

  useEffect(() => {
    let cancelled = false;
    getDoctorProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        syncForm(data, user?.full_name);
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err).message);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelEdit = () => {
    setEditing(false);
    if (profile) syncForm(profile, user?.full_name);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (form.full_name && form.full_name !== user?.full_name) {
        const updatedUser = await updateMyName(form.full_name);
        setUser(updatedUser);
      }
      const updated = await updateDoctorProfile({
        specialization: form.specialization,
        qualification: form.qualification,
        experience: Number(form.experience) || 0,
        hospital: form.hospital,
        consultation_fee: Number(form.consultation_fee) || 0,
        available_days: form.available_days,
        available_time: form.available_time,
        license_number: form.license_number || null,
      });
      setProfile(updated);
      setEditing(false);
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message={error} />;

  const field = (label: string, key: keyof typeof emptyForm, type = "text") => (
    <div className="space-y-2">
      <Label htmlFor={`df-${key}`}>{label}</Label>
      <Input
        id={`df-${key}`}
        type={type}
        value={form[key]?.toString() ?? ""}
        disabled={!editing}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, [key]: e.target.value }))
        }
      />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        {!editing ? (
          <Button onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Save className="h-4 w-4" /> Save
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {!profile ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="rounded-xl bg-card p-8 shadow ring-1 ring-foreground/10">
          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/15 text-blue-600">
              <Stethoscope className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Professional Information</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {field("Full Name", "full_name")}
            {field("Specialization", "specialization")}
            {field("Qualification", "qualification")}
            {field("Experience (years)", "experience", "number")}
            {field("Hospital", "hospital")}
            {field("Consultation Fee", "consultation_fee", "number")}
            {field("License Number", "license_number")}
            {field("Available Days", "available_days")}
            <div className="sm:col-span-2">{field("Available Time", "available_time")}</div>
          </div>
        </div>
      )}
    </div>
  );
}
