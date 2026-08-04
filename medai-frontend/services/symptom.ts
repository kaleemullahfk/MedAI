import api, { toApiError } from "./api";

export const checkSymptoms = async (symptoms: string) => {
  try {
    const response = await api.post("/symptom/check", { symptoms });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};
