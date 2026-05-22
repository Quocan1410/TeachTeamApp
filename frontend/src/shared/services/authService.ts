import axios, { AxiosError } from "axios";
import { AuthResponse, SignupData, SigninData, User } from "../types/user";
import StorageManager from "../utils/storageManager";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_ENDPOINT ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const authAPI = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available and valid
authAPI.interceptors.request.use((config) => {
  const token = AuthService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let axios set multipart boundary automatically for file uploads
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

  static saveToken(token: string): void {
    try {
      // Parse JWT to get expiration
      const payload = this.parseJWT(token);
      if (payload && payload.exp) {
        StorageManager.setItem("token", token);
        StorageManager.setItem("tokenExpiry", payload.exp.toString());
      } else {
        console.warn(
          "Invalid token structure, saving without expiry validation"
        );
        StorageManager.setItem("token", token);
      }
    } catch (error) {
      console.error("Error saving token:", error);
      StorageManager.setItem("token", token);
    }
  }

  static removeToken(): void {
    StorageManager.removeItem("token");
    StorageManager.removeItem("tokenExpiry");
  }

  static getToken(): string | null {
    try {
      const token = StorageManager.getItem("token");
      const expiry = StorageManager.getItem("tokenExpiry");

      if (token && expiry) {
        const now = Math.floor(Date.now() / 1000);
        const expiryTime = parseInt(expiry);

        // Validate expiry time is a valid number
        if (isNaN(expiryTime)) {
          console.warn("Invalid token expiry format, clearing token");
          this.removeToken();
          this.removeUser();
          return null;
        }

        if (expiryTime > now) {
          return token;
        } else {
          console.log("Token expired, cleaning up");
          this.removeToken();
          this.removeUser();
          return null;
        }
      }

      if (token) {
        // Token exists but no expiry info - validate anyway
        const payload = this.parseJWT(token);
        if (payload && payload.exp) {
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp > now) {
            // Update expiry info
            StorageManager.setItem("tokenExpiry", payload.exp.toString());
            return token;
          } else {
            console.log("Token expired during validation, cleaning up");
            this.removeToken();
            this.removeUser();
            return null;
          }
        } else {
          console.warn("Invalid token format, cannot parse JWT");
          this.removeToken();
          this.removeUser();
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting token:", error);
      this.removeToken();
      this.removeUser();
      return null;
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
      // Try versioned storage first
      const versionedUser = StorageManager.getVersionedItem<User>("user");
      if (versionedUser) {
        // Validate user object has required fields
        if (this.isValidUser(versionedUser)) {
          return versionedUser;
        } else {
          console.warn("Invalid user data found, clearing storage");
          this.removeUser();
          return null;
        }
      }

      // Fallback to regular storage
      const userStr = StorageManager.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (this.isValidUser(user)) {
          // Migrate to versioned storage
          this.saveUser(user);
          return user;
        } else {
          console.warn("Invalid user data in regular storage, clearing");
          this.removeUser();
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting user:", error);
      StorageManager.removeItem("user");
      return null;
    }
  }

  // Helper method to validate user object
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
      ["candidate", "lecturer", "admin"].includes(userObj.userType)
    );
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Parse JWT payload without verification (for expiry check)
  private static parseJWT(token: string): { exp?: number } | null {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error parsing JWT:", error);
      return null;
    }
  }

  // Sync authentication with database
  static async syncWithDatabase(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) return false;

      const response = await this.getProfile();
      if (response.success && response.data) {
        this.saveUser(response.data.user);
        return true;
      } else {
        // Token is invalid on server side
        this.removeToken();
        this.removeUser();
        return false;
      }
    } catch (error) {
      console.error("Error syncing with database:", error);
      // If network error, keep local auth but flag for retry
      return false;
    }
  }
}
