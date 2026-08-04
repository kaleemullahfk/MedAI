import api from "./api";

export const getDoctorProfile = async () => {
  const response = await api.get("/doctor-profile/me");
  return response.data;
};

export const createDoctorProfile = async (data: unknown) => {
  const response = await api.post("/doctor-profile/", data);
  return response.data;
};