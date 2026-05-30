import axios, { AxiosError } from "axios";
import {
  AuthResponse,
  SignupData,
  SigninData,
  UpdateProfileData,
  User,
} from "../types/user";
import StorageManager from "../utils/storageManager";
import { env } from "@/lib/env";

const authAPI = axios.create({
  baseURL: `${env.apiEndpoint}/auth`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

authAPI.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export class AuthService {
  static async signup(data: SignupData): Promise<AuthResponse> {
    try {
      const response = await authAPI.post("/signup", data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<AuthResponse>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred. Please try again.",
      };
    }
  }

  static async signin(data: SigninData): Promise<AuthResponse> {
    try {
      const response = await authAPI.post("/signin", data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<AuthResponse>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred. Please try again.",
      };
    }
  }

  static async logout(): Promise<AuthResponse> {
    try {
      const response = await authAPI.post("/logout");
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<AuthResponse>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred during logout.",
      };
    }
  }

  static async uploadAvatar(file: File): Promise<AuthResponse> {
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await authAPI.post("/avatar", formData);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<AuthResponse>;
      if (axiosError.response?.status === 404) {
        return {
          success: false,
          message:
            "Avatar API is not available. Restart the backend: npm run dev:backend",
        };
      }
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      const networkMessage =
        axiosError.code === "ERR_NETWORK"
          ? "Cannot reach server. Check backend is running on port 5000."
          : axiosError.message || "Network error occurred while uploading avatar.";
      return {
        success: false,
        message: networkMessage,
      };
    }
  }

  static async deleteAvatar(): Promise<AuthResponse> {
    try {
      const response = await authAPI.delete("/avatar");
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<AuthResponse>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while removing avatar.",
      };
    }
  }

  static async getProfile(): Promise<AuthResponse> {
    try {
      const response = await authAPI.get("/profile");
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<AuthResponse>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while fetching profile.",
      };
    }
  }

  static async updateProfile(data: UpdateProfileData): Promise<AuthResponse> {
    try {
      const response = await authAPI.put("/profile", data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<AuthResponse>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while updating profile.",
      };
    }
  }

  static async updateTheme(theme: "light" | "dark"): Promise<AuthResponse> {
    try {
      const response = await authAPI.patch("/theme", { theme });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<AuthResponse>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while updating theme.",
      };
    }
  }

  static saveUser(user: User): void {
    try {
      StorageManager.setVersionedItem("user", user);
    } catch (error) {
      console.error("Error saving user:", error);
      StorageManager.setItem("user", JSON.stringify(user));
    }
  }

  static removeUser(): void {
    StorageManager.removeItem("user");
  }

  static getUser(): User | null {
    try {
      const versionedUser = StorageManager.getVersionedItem<User>("user");
      if (versionedUser && this.isValidUser(versionedUser)) {
        return versionedUser;
      }

      const userStr = StorageManager.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (this.isValidUser(user)) {
          this.saveUser(user);
          return user;
        }
        this.removeUser();
      }
      return null;
    } catch (error) {
      console.error("Error getting user:", error);
      StorageManager.removeItem("user");
      return null;
    }
  }

  private static isValidUser(user: unknown): user is User {
    if (!user || typeof user !== "object" || user === null) {
      return false;
    }
    const userObj = user as Record<string, unknown>;
    return (
      "id" in user &&
      "email" in user &&
      "firstName" in user &&
      "lastName" in user &&
      "userType" in user &&
      typeof userObj.id === "number" &&
      typeof userObj.email === "string" &&
      typeof userObj.firstName === "string" &&
      typeof userObj.lastName === "string" &&
      typeof userObj.userType === "string" &&
      ["candidate", "lecturer", "admin"].includes(userObj.userType as string)
    );
  }

  static isAuthenticated(): boolean {
    return !!this.getUser();
  }

  static async syncWithDatabase(): Promise<boolean> {
    try {
      const response = await this.getProfile();
      if (response.success && response.data) {
        this.saveUser(response.data.user);
        return true;
      }
      this.removeUser();
      return false;
    } catch (error) {
      console.error("Error syncing with database:", error);
      return false;
    }
  }
}
