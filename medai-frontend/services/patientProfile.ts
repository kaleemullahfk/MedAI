import api, { toApiError } from "./api";

export const getPatientProfile = async () => {
  try {
    const response = await api.get("/patient-profile/me");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updatePatientProfile = async (data: Record<string, unknown>) => {
  try {
    const response = await api.put("/patient-profile/me", data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};
