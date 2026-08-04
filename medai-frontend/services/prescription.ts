import api, { toApiError } from "./api";

export const analyzePrescription = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await api.post("/prescription/analyze-file", formData);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};
