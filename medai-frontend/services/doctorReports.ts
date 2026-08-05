import api, { toApiError } from "./api";

export interface ReportRecord {
  id: number;
  title: string;
  file_name: string;
  file_type: string;
  extracted_text: string | null;
  ai_analysis: string | null;
  uploaded_at: string;
  download_url?: string | null;
}

export interface ReportDetail {
  id: number;
  title: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
  download_url?: string | null;
  patient?: {
    id: number;
    full_name: string;
    age?: number | null;
    gender?: string | null;
  } | null;
  analysis?: {
    summary?: string | null;
    abnormal_values?: string[] | null;
    abnormal_findings?: string[] | null;
    possible_diseases?: string[] | null;
    risk_level?: string | null;
    recommendations?: string[] | null;
    lifestyle_advice?: string[] | null;
    exercise_advice?: string[] | null;
    follow_up?: string | null;
    emergency_warning?: string | null;
  } | null;
  history?: ReportRecord[];
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

/** Doctors/admins: fetch full detail for one report (saved analysis + history). */
export const getReportDetail = async (reportId: number): Promise<ReportDetail> => {
  try {
    const response = await api.get(`/report/detail/${reportId}`);
    return response.data as ReportDetail;
  } catch (error) {
    throw toApiError(error);
  }
};
