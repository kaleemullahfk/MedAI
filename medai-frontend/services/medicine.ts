import api from "./api";

export const recommendMedicine = async (symptoms: string) => {
  const response = await api.post("/medicine/recommend", {
    symptoms,
  });

  return response.data;
};