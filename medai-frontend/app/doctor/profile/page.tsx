"use client";

import { useEffect, useState } from "react";
import { getDoctorProfile } from "@/services/doctorProfile";

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

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getDoctorProfile();
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
        Loading...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Doctor Profile
      </h1>

      <div className="bg-white rounded-xl shadow p-8">

        <div className="grid grid-cols-2 gap-6">

          <div>
            <p className="text-gray-500">Specialization</p>
            <h2 className="font-semibold text-lg">
              {profile.specialization}
            </h2>
          </div>

          <div>
            <p className="text-gray-500">Qualification</p>
            <h2 className="font-semibold text-lg">
              {profile.qualification}
            </h2>
          </div>

          <div>
            <p className="text-gray-500">Experience</p>
            <h2 className="font-semibold text-lg">
              {profile.experience} Years
            </h2>
          </div>

          <div>
            <p className="text-gray-500">Consultation Fee</p>
            <h2 className="font-semibold text-lg">
              Rs. {profile.consultation_fee}
            </h2>
          </div>

          <div>
            <p className="text-gray-500">Hospital</p>
            <h2 className="font-semibold text-lg">
              {profile.hospital}
            </h2>
          </div>

          <div>
            <p className="text-gray-500">Available Days</p>
            <h2 className="font-semibold text-lg">
              {profile.available_days}
            </h2>
          </div>

          <div className="col-span-2">
            <p className="text-gray-500">Available Time</p>
            <h2 className="font-semibold text-lg">
              {profile.available_time}
            </h2>
          </div>

        </div>
      </div>
    </div>
  );
}