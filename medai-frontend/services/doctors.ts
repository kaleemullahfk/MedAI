import api, { toApiError } from "./api";

export interface DoctorListItem {
  id: number;
  user_id: number;
  specialization: string;
  qualification: string;
  experience: number;
  hospital: string;
  consultation_fee: number;
  available_days: string;
  available_time: string;
  user?: { id: number; full_name: string; email: string } | null;
}

/** Public doctor directory used by patients when booking. */
export const getDoctors = async (): Promise<DoctorListItem[]> => {
  try {
    const response = await api.get("/doctor-profile/doctors");
    return response.data as DoctorListItem[];
  } catch (error) {
    throw toApiError(error);
  }
};
