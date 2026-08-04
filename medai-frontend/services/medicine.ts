import api, { toApiError } from "./api";

export const recommendMedicine = async (symptoms: string) => {
  try {
    const response = await api.post("/medicine/recommend", { symptoms });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};
