"use client";

import { useEffect, useState } from "react";
import { getMyAppointments } from "@/services/patient";

interface Appointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: string;
  doctor_id: number;
}

export default function MyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const data = await getMyAppointments();
        setAppointments(data);
      } catch (error) {
        console.error(error);
      }
    };

    loadAppointments();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        My Appointments
      </h1>

      <div className="space-y-4">
        {appointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
            No appointments found.
          </div>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-xl shadow p-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    Doctor ID: {appointment.doctor_id}
                  </h2>

                  <p className="text-gray-600 mt-2">
                    📅 {appointment.appointment_date}
                  </p>

                  <p className="text-gray-600">
                    🕒 {appointment.appointment_time}
                  </p>

                  <p className="mt-3">
                    <strong>Reason:</strong> {appointment.reason}
                  </p>
                </div>

                <div>
                  <span
                    className={`px-4 py-2 rounded-full text-white ${
                      appointment.status === "Pending"
                        ? "bg-yellow-500"
                        : appointment.status === "Accepted"
                        ? "bg-green-600"
                        : appointment.status === "Completed"
                        ? "bg-blue-600"
                        : "bg-red-600"
                    }`}
                  >
                    {appointment.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}