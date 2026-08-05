import api, { toApiError } from "./api";
import type { User } from "@/types/auth";

export interface AdminStats {
  doctors: number;
  patients: number;
  appointments: number;
}

export interface CreateUserPayload {
  full_name: string;
  email: string;
  password: string;
  role: "patient" | "doctor" | "admin";
}

export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const response = await api.get("/dashboard/admin");
    return response.data as AdminStats;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getAdminUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get("/admin/users");
    return response.data as User[];
  } catch (error) {
    throw toApiError(error);
  }
};

export const createAdminUser = async (payload: CreateUserPayload): Promise<User> => {
  try {
    const response = await api.post("/admin/users", payload);
    return response.data as User;
  } catch (error) {
    throw toApiError(error);
  }
};

export const toggleUserActive = async (userId: number): Promise<User> => {
  try {
    const response = await api.patch(`/admin/users/${userId}/toggle-active`);
    return response.data as User;
  } catch (error) {
    throw toApiError(error);
  }
};

export const deleteUser = async (userId: number): Promise<void> => {
  try {
    await api.delete(`/admin/users/${userId}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const resetUserPassword = async (
  userId: number,
  newPassword: string,
): Promise<User> => {
  try {
    const response = await api.post(`/admin/users/${userId}/reset-password`, {
      new_password: newPassword,
    });
    return response.data as User;
  } catch (error) {
    throw toApiError(error);
  }
};
