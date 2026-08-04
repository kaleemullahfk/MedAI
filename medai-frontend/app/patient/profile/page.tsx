"use client";

import { useEffect, useState } from "react";
import { getPatientProfile } from "@/services/patientProfile";

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

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getPatientProfile();
        setProfile(data);
      } catch (error) {
        console.error(error);
      }
    };

    loadProfile();
  }, []);

  if (!profile) {
    return (
      <div className="text-center mt-20 text-xl">
        Loading Profile...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Patient Profile
      </h1>

      <div className="bg-white rounded-xl shadow p-8 space-y-4">

        <div className="grid grid-cols-2 gap-6">

          <div>
            <label className="font-semibold">Age</label>
            <p>{profile.age}</p>
          </div>

          <div>
            <label className="font-semibold">Gender</label>
            <p>{profile.gender}</p>
          </div>

          <div>
            <label className="font-semibold">Phone</label>
            <p>{profile.phone}</p>
          </div>

          <div>
            <label className="font-semibold">Blood Group</label>
            <p>{profile.blood_group}</p>
          </div>

          <div>
            <label className="font-semibold">Height</label>
            <p>{profile.height}</p>
          </div>

          <div>
            <label className="font-semibold">Weight</label>
            <p>{profile.weight}</p>
          </div>

          <div className="col-span-2">
            <label className="font-semibold">Address</label>
            <p>{profile.address}</p>
          </div>

          <div className="col-span-2">
            <label className="font-semibold">Medical History</label>
            <p>{profile.medical_history}</p>
          </div>

          <div className="col-span-2">
            <label className="font-semibold">Allergies</label>
            <p>{profile.allergies}</p>
          </div>

        </div>
      </div>
    </div>
  );
}