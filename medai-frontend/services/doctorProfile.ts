import api, { toApiError } from "./api";

export const getDoctorProfile = async () => {
  try {
    const response = await api.get("/doctor-profile/me");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updateDoctorProfile = async (data: Record<string, unknown>) => {
  try {
    const response = await api.put("/doctor-profile/me", data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};
