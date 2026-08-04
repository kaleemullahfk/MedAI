import api from "./api";

export const getPatientProfile = async () => {
  const response = await api.get("/patient-profile/me");
  return response.data;
};

export const createPatientProfile = async (data: unknown) => {
  const response = await api.post("/patient-profile/", data);
  return response.data;
};