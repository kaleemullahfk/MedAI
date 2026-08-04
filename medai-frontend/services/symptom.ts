import api from "./api";

export const checkSymptoms = async (symptoms: string) => {
  const response = await api.post("/symptom/check", {
    symptoms,
  });

  return response.data;
};