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

/** Update the current user's full name (PUT /users/me). */
export const updateMyName = async (fullName: string): Promise<User> => {
  try {
    const response = await api.put("/users/me", { full_name: fullName });
    return response.data as User;
  } catch (error) {
    throw toApiError(error);
  }
};
