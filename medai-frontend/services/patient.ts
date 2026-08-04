import api from "./api";

export const getPatientDashboard = async () => {
  const response = await api.get("/dashboard/patient");
  return response.data;
};

export const getPatientProfile = async () => {
  const response = await api.get("/patient-profile/me");
  return response.data;
};

export const bookAppointment = async (data: {
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  reason: string;
}) => {
  const response = await api.post("/appointment/", data);
  return response.data;
};

export const getMyAppointments = async () => {
  const response = await api.get("/appointment/my");
  return response.data;
};