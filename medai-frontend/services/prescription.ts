import api, { toApiError } from "./api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface MedicineItem {
  medicine: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
}

export interface PrescriptionRecord {
  id: number;
  doctor_id: number;
  patient_id: number;
  appointment_id?: number | null;
  report_id?: number | null;
  status: string;
  diagnosis: string;
  clinical_findings?: string | null;
  ai_summary?: string | null;
  severity?: string | null;
  medicines: string; // JSON string of MedicineItem[]
  lifestyle_advice?: string | null;
  diet_recommendations?: string | null;
  exercise_recommendations?: string | null;
  hydration_advice?: string | null;
  follow_up?: string | null;
  lab_tests?: string | null;
  emergency_warnings?: string | null;
  interactions?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
  doctor?: { id: number; full_name: string; email: string } | null;
  patient?: { id: number; full_name: string; email: string } | null;
  report_title?: string | null;
}

export function parseMedicines(raw: string | null): MedicineItem[] {
  if (!raw) return [];
  try {
    const d = JSON.parse(raw);
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Analyzer (patient uploads a prescription image/PDF)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------
export const generateAiPrescription = async (reportId: number) => {
  try {
    const response = await api.post(`/prescription/generate?report_id=${reportId}`);
    return response.data as PrescriptionRecord;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getDoctorPrescriptions = async (): Promise<PrescriptionRecord[]> => {
  try {
    const response = await api.get("/prescription/doctor");
    return response.data as PrescriptionRecord[];
  } catch (error) {
    throw toApiError(error);
  }
};

export const getPrescriptionsByReport = async (reportId: number): Promise<PrescriptionRecord[]> => {
  try {
    const response = await api.get(`/prescription/by-report/${reportId}`);
    return response.data as PrescriptionRecord[];
  } catch (error) {
    throw toApiError(error);
  }
};

export const createPrescription = async (data: Record<string, unknown>) => {
  try {
    const response = await api.post("/prescription", data);
    return response.data as PrescriptionRecord;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updatePrescription = async (id: number, data: Record<string, unknown>) => {
  try {
    const response = await api.put(`/prescription/${id}`, data);
    return response.data as PrescriptionRecord;
  } catch (error) {
    throw toApiError(error);
  }
};

export const approvePrescription = async (id: number) => {
  try {
    const response = await api.post(`/prescription/${id}/approve`);
    return response.data as PrescriptionRecord;
  } catch (error) {
    throw toApiError(error);
  }
};

export const deletePrescription = async (id: number) => {
  try {
    await api.delete(`/prescription/${id}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const downloadPrescriptionPdf = async (id: number) => {
  try {
    const response = await api.get(`/prescription/${id}/pdf`, { responseType: "blob" });
    return response.data as Blob;
  } catch (error) {
    throw toApiError(error);
  }
};
