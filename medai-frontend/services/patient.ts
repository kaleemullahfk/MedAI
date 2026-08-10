import api, { toApiError } from "./api";

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: string;
  doctor?: { id: number; full_name: string; email: string } | null;
  patient?: { id: number; full_name: string; email: string } | null;
}

export const getPatientDashboard = async () => {
  try {
    const response = await api.get("/dashboard/patient");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const bookAppointment = async (data: {
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  reason: string;
}) => {
  try {
    const response = await api.post("/appointment", data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getMyAppointments = async (): Promise<Appointment[]> => {
  try {
    const response = await api.get("/appointment/my");
    return response.data as Appointment[];
  } catch (error) {
    throw toApiError(error);
  }
};

export const cancelAppointment = async (id: number) => {
  try {
    const response = await api.put(`/appointment/${id}/cancel`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const rescheduleAppointment = async (
  id: number,
  data: { new_date: string; new_time: string; reason?: string },
) => {
  try {
    const response = await api.put(`/appointment/${id}/reschedule`, data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};
