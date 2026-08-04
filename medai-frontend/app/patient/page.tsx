"use client";

import { useEffect, useState } from "react";

import DashboardCard from "@/components/patient/DashboardCard";
import { getPatientDashboard } from "@/services/patient";

export default function PatientDashboard() {
  const [dashboard, setDashboard] = useState({
    appointments: 0,
    reports: 0,
    prescriptions: 0,
    chat_history: 0,
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await getPatientDashboard();
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
          title="Appointments"
          value={dashboard.appointments.toString()}
        />

        <DashboardCard
          title="Reports"
          value={dashboard.reports.toString()}
        />

        <DashboardCard
          title="Prescriptions"
          value={dashboard.prescriptions.toString()}
        />

        <DashboardCard
          title="AI Chats"
          value={dashboard.chat_history.toString()}
        />
      </div>

      <div className="bg-white rounded-xl shadow mt-8 p-6">
        <h2 className="text-2xl font-bold mb-4">
          Welcome to MEDAI
        </h2>

        <p className="text-gray-500">
          Manage appointments, reports, prescriptions, and AI healthcare assistance from one place.
        </p>
      </div>
    </>
  );
}