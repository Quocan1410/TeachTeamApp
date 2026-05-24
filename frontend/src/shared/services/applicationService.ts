import axios, { AxiosError } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_ENDPOINT ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const applicationAPI = axios.create({
  baseURL: `${API_BASE_URL}/applications`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
applicationAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types for API responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

export interface Course {
  id: number;
  courseCode: string;
  courseName: string;
  semester: string;
  description?: string;
  maxTutors: number;
  maxLabAssistants: number;
  // Position tracking fields (optional for backward compatibility)
  availableTutors?: number;
  availableLabAssistants?: number;
  selectedTutors?: number;
  selectedLabAssistants?: number;
}

export interface Role {
  id: number;
  roleName: string;
  description?: string;
}

export interface ApplicationData {
  courseId: number;
  roleId: number;
  availability: "Part Time" | "Full Time";
  skills: string;
  experience?: string;
  motivation: string;
}

export interface ApplicationResponse {
  id: number;
  candidateId: number;
  courseId: number;
  roleId: number;
  status: "pending" | "selected" | "rejected";
  availability: { type: string };
  skills?: string;
  experience?: string;
  motivation?: string;
  appliedAt: string;
  updatedAt: string;
  // New lecturer fields
  comment?: string;
  commentedBy?: number;
  commentedAt?: string;
  rank?: number;
  rankedBy?: number;
  rankedAt?: string;
  rankedForCourse?: string;
  // Relationships
  course: Course;
  role: Role;
  candidate?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    isBlocked: boolean;
  };
  commentedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  rankedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ApplicationStatistics {
  totalApplications: number;
  applicationsByRole: { tutor: number; lab_assistant: number };
  applicationsByCourse: Array<{ course: string; count: number }>;
  applicationsByStatus: { pending: number; selected: number; rejected: number };
  skillFrequency: Array<{ skill: string; frequency: number }>;
  availabilityDistribution: { partTime: number; fullTime: number };
}

export interface ApplicationFilters {
  candidateName?: string;
  roleType?: string;
  availability?: string;
  skills?: string;
  courseCode?: string;
  status?: string;
}

export class ApplicationService {
  // PA Part C: Create new application
  static async createApplication(
    data: ApplicationData
  ): Promise<ApiResponse<ApplicationResponse>> {
    try {
      const response = await applicationAPI.post("/", data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<ApplicationResponse>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred. Please try again.",
      };
    }
  }

  // PA Part C: Get candidate's applications
  static async getMyCandidateApplications(): Promise<
    ApiResponse<ApplicationResponse[]>
  > {
    try {
      const response = await applicationAPI.get("/my-applications");
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<
        ApiResponse<ApplicationResponse[]>
      >;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while fetching applications.",
      };
    }
  }

  // PA Part C: Get available courses and roles
  static async getCoursesAndRoles(): Promise<
    ApiResponse<{ courses: Course[]; roles: Role[] }>
  > {
    try {
      const response = await applicationAPI.get("/courses-and-roles");
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<
        ApiResponse<{ courses: Course[]; roles: Role[] }>
      >;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while fetching courses and roles.",
      };
    }
  }

  // PA Part D: Get assigned courses for lecturer
  static async getAssignedCoursesForLecturer(): Promise<ApiResponse<Course[]>> {
    try {
      const response = await applicationAPI.get("/lecturer-assigned-courses");
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<Course[]>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while fetching assigned courses.",
      };
    }
  }

  // CR Part: Get applications for lecturer with filtering
  static async getApplicationsForLecturer(
    filters?: ApplicationFilters
  ): Promise<ApiResponse<ApplicationResponse[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.candidateName)
        queryParams.set("candidateName", filters.candidateName);
      if (filters?.roleType) queryParams.set("roleType", filters.roleType);
      if (filters?.availability)
        queryParams.set("availability", filters.availability);
      if (filters?.skills) queryParams.set("skills", filters.skills);
      if (filters?.courseCode)
        queryParams.set("courseCode", filters.courseCode);
      if (filters?.status) queryParams.set("status", filters.status);

      const url = queryParams.toString()
        ? `/lecturer?${queryParams}`
        : "/lecturer";

      const response = await applicationAPI.get(url);

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<
        ApiResponse<ApplicationResponse[]>
      >;

      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while fetching applications.",
      };
    }
  }

  // DI Part: Get application statistics
  static async getApplicationStatistics(): Promise<
    ApiResponse<ApplicationStatistics>
  > {
    try {
      const response = await applicationAPI.get("/statistics");
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<
        ApiResponse<ApplicationStatistics>
      >;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while fetching statistics.",
      };
    }
  }

  // CR Part: Update application status
  static async updateApplicationStatus(
    applicationId: number,
    status: "pending" | "selected" | "rejected",
    comment?: string,
    selectedCourses?: string[]
  ): Promise<ApiResponse<ApplicationResponse>> {
    try {
      const requestData: {
        status: string;
        comment?: string;
        selectedCourses?: string[];
      } = { status };
      if (comment) requestData.comment = comment;
      if (selectedCourses) requestData.selectedCourses = selectedCourses;

      const response = await applicationAPI.put(
        `/${applicationId}/status`,
        requestData
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<ApplicationResponse>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while updating application status.",
      };
    }
  }

  // Comment management methods
  static async updateApplicationComment(
    applicationId: number,
    comment: string
  ): Promise<ApiResponse<ApplicationResponse>> {
    try {
      const response = await applicationAPI.put(`/${applicationId}/comment`, {
        comment,
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<ApplicationResponse>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while updating comment.",
      };
    }
  }

  static async deleteApplicationComment(
    applicationId: number
  ): Promise<ApiResponse<ApplicationResponse>> {
    try {
      const response = await applicationAPI.delete(`/${applicationId}/comment`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<ApplicationResponse>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while deleting comment.",
      };
    }
  }

  // Ranking management methods
  static async addApplicationToRanking(
    applicationId: number,
    rank: number,
    courseCode: string
  ): Promise<ApiResponse<ApplicationResponse>> {
    try {
      const response = await applicationAPI.post(`/${applicationId}/ranking`, {
        rank,
        courseCode,
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<ApplicationResponse>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while adding to ranking.",
      };
    }
  }

  static async updateApplicationRanking(
    applicationId: number,
    rank: number,
    courseCode: string
  ): Promise<ApiResponse<ApplicationResponse>> {
    try {
      const response = await applicationAPI.put(`/${applicationId}/ranking`, {
        rank,
        courseCode,
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<ApplicationResponse>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while updating ranking.",
      };
    }
  }

  static async removeApplicationFromRanking(
    applicationId: number
  ): Promise<ApiResponse<ApplicationResponse>> {
    try {
      const response = await applicationAPI.delete(`/${applicationId}/ranking`);
      return response.data;
    } catch (error: unknown) {
      console.error("Remove from ranking request failed:", error);
      const axiosError = error as AxiosError<ApiResponse<ApplicationResponse>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while removing from ranking.",
      };
    }
  }

  // Test method for debugging course validation
  static async testCourseValidation(
    selectedCourses: string[]
  ): Promise<ApiResponse<unknown>> {
    try {
      const response = await applicationAPI.post("/test-course-validation", {
        selectedCourses,
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred during course validation test.",
      };
    }
  }
}
