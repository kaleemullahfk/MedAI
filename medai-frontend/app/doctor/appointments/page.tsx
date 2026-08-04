"use client";

import { useEffect, useState } from "react";
import {
  getDoctorAppointments,
  acceptAppointment,
  rejectAppointment,
  completeAppointment,
} from "@/services/appointment";

interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: string;
}

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const loadAppointments = async () => {
    try {
      const data = await getDoctorAppointments();
      setAppointments(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const fetchAppointments = async () => {
        await loadAppointments();
    };

    fetchAppointments();
}, []);

  return (
    <div className="p-8">

      <h1 className="text-3xl font-bold mb-6">
        Doctor Appointments
      </h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-blue-600 text-white">

            <tr>
              <th className="p-4">ID</th>
              <th>Patient</th>
              <th>Date</th>
              <th>Time</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            {appointments.map((item) => (

              <tr
                key={item.id}
                className="border-b"
              >

                <td className="p-4">{item.id}</td>

                <td>{item.patient_id}</td>

                <td>{item.appointment_date}</td>

                <td>{item.appointment_time}</td>

                <td>{item.reason}</td>

                <td>{item.status}</td>

                <td className="space-x-2">

                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded"
                    onClick={async () => {
                      await acceptAppointment(item.id);
                      loadAppointments();
                    }}
                  >
                    Accept
                  </button>

                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={async () => {
                      await rejectAppointment(item.id);
                      loadAppointments();
                    }}
                  >
                    Reject
                  </button>

                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                    onClick={async () => {
                      await completeAppointment(item.id);
                      loadAppointments();
                    }}
                  >
                    Complete
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}