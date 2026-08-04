import api, { toApiError } from "./api";
import type { User } from "@/types/auth";

/** Patients who have booked with the current doctor (GET /users/doctor/patients). */
export const getDoctorPatients = async (): Promise<User[]> => {
  try {
    const response = await api.get("/users/doctor/patients");
    return response.data as User[];
  } catch (error) {
    throw toApiError(error);
  }
};
