import api, { toApiError } from "./api";

export interface ReportRecord {
  id: number;
  title: string;
  file_name: string;
  file_type: string;
  extracted_text: string | null;
  ai_analysis: string | null;
  uploaded_at: string;
}

/** Doctors/admins: fetch a specific patient's reports. */
export const getPatientReports = async (patientId: number): Promise<ReportRecord[]> => {
  try {
    const response = await api.get(`/report/patient/${patientId}`);
    return response.data as ReportRecord[];
  } catch (error) {
    throw toApiError(error);
  }
};
