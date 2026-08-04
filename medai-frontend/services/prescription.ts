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

export interface PrescriptionRecord {
  id: number;
  doctor_id: number;
  patient_id: number;
  appointment_id: number | null;
  diagnosis: string;
  medicines: string;
  instructions: string | null;
  created_at: string;
  patient?: { id: number; full_name: string; email: string } | null;
  doctor?: { id: number; full_name: string; email: string } | null;
}

export const getDoctorPrescriptions = async (): Promise<PrescriptionRecord[]> => {
  try {
    const response = await api.get("/prescription/doctor");
    return response.data as PrescriptionRecord[];
  } catch (error) {
    throw toApiError(error);
  }
};

export const createPrescription = async (data: {
  patient_id: number;
  appointment_id?: number | null;
  diagnosis: string;
  medicines: string;
  instructions?: string | null;
}) => {
  try {
    const response = await api.post("/prescription/", data);
    return response.data as PrescriptionRecord;
  } catch (error) {
    throw toApiError(error);
  }
};
