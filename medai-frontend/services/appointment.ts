import api from "./api";

export const getDoctorAppointments = async () => {
  const response = await api.get("/appointment/doctor");
  return response.data;
};

export const acceptAppointment = async (id: number) => {
  const response = await api.put(`/appointment/${id}/accept`);
  return response.data;
};

export const rejectAppointment = async (id: number) => {
  const response = await api.put(`/appointment/${id}/reject`);
  return response.data;
};

export const completeAppointment = async (id: number) => {
  const response = await api.put(`/appointment/${id}/complete`);
  return response.data;
};