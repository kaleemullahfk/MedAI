import api from "./api";

export const explainDisease = async (disease: string) => {
  const response = await api.post("/disease/explain", {
    disease,
  });

  return response.data;
};