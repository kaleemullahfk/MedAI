import api, { toApiError } from "./api";

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

export const getMyAppointments = async () => {
  try {
    const response = await api.get("/appointment/my");
    return response.data;
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
