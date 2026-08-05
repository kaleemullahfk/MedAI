import api, { toApiError } from "./api";

export interface PatientProfile {
  id: number;
  user_id: number;
  age: number | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  blood_group: string | null;
  height: string | null;
  weight: string | null;
  emergency_contact: string | null;
  medical_history: string | null;
  allergies: string | null;
}

export const getPatientProfile = async (): Promise<PatientProfile> => {
  try {
    const response = await api.get("/patient-profile/me");
    return response.data as PatientProfile;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updatePatientProfile = async (
  data: Partial<PatientProfile>,
): Promise<PatientProfile> => {
  try {
    const response = await api.put("/patient-profile/me", data);
    return response.data as PatientProfile;
  } catch (error) {
    throw toApiError(error);
  }
};
