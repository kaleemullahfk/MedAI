import api, { toApiError } from "./api";

export const uploadReport = async (file: File, title: string = "Medical Report") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);

  try {
    const response = await api.post("/report/upload", formData);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getMyReports = async () => {
  try {
    const response = await api.get("/report/my");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const deleteReport = async (id: number) => {
  try {
    const response = await api.delete(`/report/${id}`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

/** Fetch a report file as a Blob (for the doctor reports view / download). */
export const downloadReport = async (id: number) => {
  try {
    const response = await api.get(`/report/download/${id}`, {
      responseType: "blob",
    });
    return response.data as Blob;
  } catch (error) {
    throw toApiError(error);
  }
};
