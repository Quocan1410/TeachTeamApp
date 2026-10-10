import { AssignedCourse } from "./courseTypes";

export enum UserType {
  CANDIDATE = "candidate",
  LECTURER = "lecturer",
  ADMIN = "admin",
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  honorific?: string | null;
  isBlocked: boolean;
  avatarUrl?: string | null;
  description?: string | null;
  skills?: string | null;
  website?: string | null;
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
  firstName: string;
  lastName: string;
  userType: UserType;
  honorific?: string;
}

export interface SigninData {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  honorific?: string;
  description?: string;
  skills?: string;
  website?: string;
}
