import { AssignedCourse } from "./courseTypes";

export enum UserType {
  CANDIDATE = "candidate",
  LECTURER = "lecturer",
  ADMIN = "admin",
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  honorific?: string | null;
  isBlocked: boolean;
  avatarUrl?: string | null;
  theme?: "light" | "dark";
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token?: string;
    assignedCourses?: AssignedCourse[];
  };
  errors?: Record<string, string>;
}

export interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  honorific?: string;
}

export interface SigninData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
}
