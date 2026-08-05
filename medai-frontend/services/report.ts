import api, { toApiError } from "./api";

export interface ReportRecord {
  id: number;
  title: string;
  file_name: string;
  file_type: string;
  extracted_text: string | null;
  /** JSON string of the analysis object (backend stores it as Text). */
  ai_analysis: string | null;
  uploaded_at: string;
}

export interface ReportAnalysis {
  summary?: string;
  findings?: string[];
  abnormal_values?: string[];
  abnormal_findings?: string[];
  possible_diseases?: string[];
  risk_level?: "Low" | "Moderate" | "High";
  recommendations?: string[];
  lifestyle_advice?: string[];
  exercise_advice?: string[];
  follow_up?: string;
  emergency_warning?: string;
}

/** Parse the backend's ai_analysis JSON string into an object. */
export function parseAnalysis(raw: string | null): ReportAnalysis {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ReportAnalysis;
  } catch {
    return {};
  }
}

export const uploadReport = async (file: File, title: string = "Medical Report") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);

  try {
    const response = await api.post("/report/upload", formData);
    return response.data as ReportRecord;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getMyReports = async (): Promise<ReportRecord[]> => {
  try {
    const response = await api.get("/report/my");
    return response.data as ReportRecord[];
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
