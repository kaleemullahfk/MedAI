import api, { toApiError } from "./api";

export interface DoctorProfile {
  id: number;
  user_id: number;
  specialization: string;
  qualification: string;
  experience: number;
  hospital: string;
  consultation_fee: number;
  available_days: string;
  available_time: string;
  license_number: string | null;
  is_verified: boolean;
}

export const getDoctorProfile = async (): Promise<DoctorProfile> => {
  try {
    const response = await api.get("/doctor-profile/me");
    return response.data as DoctorProfile;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updateDoctorProfile = async (
  data: Partial<DoctorProfile>,
): Promise<DoctorProfile> => {
  try {
    const response = await api.put("/doctor-profile/me", data);
    return response.data as DoctorProfile;
  } catch (error) {
    throw toApiError(error);
  }
};
