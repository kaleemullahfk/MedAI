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

export interface RangeInfo {
  start: string;
  end: string;
  days: number;
}

export interface OverviewStats {
  total_patients: number;
  total_doctors: number;
  total_appointments: number;
  today_appointments: number;
  pending_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  total_reports: number;
  total_prescriptions: number;
  total_ai_analyses: number;
  total_ai_prescriptions: number;
  active_users_today: number;
  growth: {
    appointments: number;
    patients: number;
    reports: number;
  };
}

export interface DailyPoint {
  date: string;
  count: number;
}

export interface AppointmentAnalytics {
  daily: DailyPoint[];
  monthly: { month: string; count: number }[];
  status: { label: string; count: number }[];
  by_doctor: { doctor: string; count: number }[];
  peak_hours: { hour: string; count: number }[];
  upcoming: number;
}

export interface AiAnalytics {
  total_analyses: number;
  total_prescriptions: number;
  most_diseases: { label: string; count: number }[];
  most_symptoms: { label: string; count: number }[];
  most_medicines: { label: string; count: number }[];
  risk_distribution: { label: string; count: number }[];
  usage_growth: DailyPoint[];
}

export interface ReportsAnalytics {
  today: number;
  monthly_uploads: number;
  categories: { label: string; count: number }[];
  normal_vs_abnormal: Record<string, number>;
  avg_per_patient: number;
}

export interface PrescriptionsAnalytics {
  total: number;
  draft: number;
  approved: number;
  rejected: number;
  most_diagnoses: { label: string; count: number }[];
  most_medicines: { label: string; count: number }[];
}

export interface Insight {
  type: string;
  label: string;
  value: string;
}

export interface RecentActivity {
  type: string;
  action: string;
  name: string;
  time: string;
}

export interface AnalyticsResponse {
  range: RangeInfo;
  overview: OverviewStats;
  appointments: AppointmentAnalytics;
  ai: AiAnalytics;
  reports: ReportsAnalytics;
  prescriptions: PrescriptionsAnalytics;
  doctors: {
    total: number;
    most_active: { doctor: string; appointments: number; patients_treated: number; prescriptions: number }[];
  };
  patients: {
    total: number;
    new_in_range: number;
    most_active: { patient: string; appointments: number; reports: number }[];
  };
  insights: Insight[];
  recent_activity: RecentActivity[];
}

export const getAdminAnalytics = async (days = 30): Promise<AnalyticsResponse> => {
  try {
    const response = await api.get(`/dashboard/admin/analytics?days=${days}`);
    return response.data as AnalyticsResponse;
  } catch (error) {
    throw toApiError(error);
  }
};
