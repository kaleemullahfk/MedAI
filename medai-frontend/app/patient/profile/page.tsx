"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserRound, Loader2, Pencil, Save } from "lucide-react";

import {
  getPatientProfile,
  updatePatientProfile,
  type PatientProfile,
} from "@/services/patientProfile";
import { updateMyName } from "@/services/users";
import { useAuth } from "@/hooks/useAuth";
import { toApiError } from "@/services/api";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emptyForm: Partial<PatientProfile> & { full_name: string } = {
  full_name: "",
  age: null,
  gender: "",
  phone: "",
  address: "",
  blood_group: "",
  height: "",
  weight: "",
  emergency_contact: "",
  medical_history: "",
  allergies: "",
};

export default function PatientProfilePage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPatientProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setForm({
          full_name: user?.full_name ?? "",
          age: data.age,
          gender: data.gender ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          blood_group: data.blood_group ?? "",
          height: data.height ?? "",
          weight: data.weight ?? "",
          emergency_contact: data.emergency_contact ?? "",
          medical_history: data.medical_history ?? "",
          allergies: data.allergies ?? "",
        });
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err).message);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.full_name]);

  const startEdit = () => setEditing(true);

  const cancelEdit = () => {
    setEditing(false);
    if (profile) {
      setForm({
        full_name: user?.full_name ?? "",
        age: profile.age,
        gender: profile.gender ?? "",
        phone: profile.phone ?? "",
        address: profile.address ?? "",
        blood_group: profile.blood_group ?? "",
        height: profile.height ?? "",
        weight: profile.weight ?? "",
        emergency_contact: profile.emergency_contact ?? "",
        medical_history: profile.medical_history ?? "",
        allergies: profile.allergies ?? "",
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (form.full_name && form.full_name !== user?.full_name) {
        const updatedUser = await updateMyName(form.full_name);
        setUser(updatedUser);
      }
      const updated = await updatePatientProfile({
        age: form.age,
        gender: form.gender,
        phone: form.phone,
        address: form.address,
        blood_group: form.blood_group,
        height: form.height,
        weight: form.weight,
        emergency_contact: form.emergency_contact,
        medical_history: form.medical_history,
        allergies: form.allergies,
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
      <Label htmlFor={`pf-${key}`}>{label}</Label>
      <Input
        id={`pf-${key}`}
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
          <Button onClick={startEdit}>
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
              <UserRound className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Personal Information</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {field("Full Name", "full_name")}
            {field("Phone", "phone")}
            {field("Age", "age", "number")}
            {field("Gender", "gender")}
            {field("Blood Group", "blood_group")}
            {field("Height", "height")}
            {field("Weight", "weight")}
            {field("Emergency Contact", "emergency_contact")}
            {field("Address", "address")}
            <div className="sm:col-span-2">{field("Medical History", "medical_history")}</div>
            <div className="sm:col-span-2">{field("Allergies", "allergies")}</div>
          </div>
        </div>
      )}
    </div>
  );
}
