import api from "./api";

export const getDoctorDashboard = async () => {
  const response = await api.get("/dashboard/doctor");
  return response.data;
};

export const getPatientDashboard = async () => {
  const response = await api.get("/dashboard/patient");
  return response.data;
};

export const getAdminDashboard = async () => {
  const response = await api.get("/dashboard/admin");
  return response.data;
};