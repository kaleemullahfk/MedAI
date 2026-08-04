import api, { toApiError } from "./api";

export const explainDisease = async (disease: string) => {
  try {
    const response = await api.post("/disease/explain", { disease });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};
