export type Role = "patient" | "doctor" | "admin";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  role: "patient" | "doctor";
}
