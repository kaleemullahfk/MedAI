"use client";

import { useEffect, useState } from "react";

import DashboardCard from "@/components/doctor/DashboardCard";
import { getDoctorDashboard } from "@/services/dashboard";

export default function DoctorDashboard() {
  const [dashboard, setDashboard] = useState({
    appointments: 0,
    patients: 0,
    reports: 0,
    chats: 0,
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await getDoctorDashboard();
        setDashboard(data);
      } catch (error) {
        console.error(error);
      }
    };

    loadDashboard();
  }, []);

  return (
    <>
      <div className="grid grid-cols-4 gap-6">
        <DashboardCard
          title="Today's Appointments"
          value={dashboard.appointments.toString()}
        />

        <DashboardCard
          title="Patients"
          value={dashboard.patients.toString()}
        />

        <DashboardCard
          title="Reports"
          value={dashboard.reports.toString()}
        />

        <DashboardCard
          title="AI Chats"
          value={dashboard.chats.toString()}
        />
      </div>

      <div className="bg-white rounded-xl shadow mt-8 p-6">
        <h2 className="text-xl font-bold mb-5">
          Today&apos;s Schedule
        </h2>

        <p className="text-gray-500">
          Appointment list will appear here.
        </p>
      </div>
    </>
  );
}