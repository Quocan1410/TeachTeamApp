import { AxiosError } from "axios";
import { createApiClient } from "./apiClient";

const applicationAPI = createApiClient("/applications");

// Types for API responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
  applicationDeadline?: string | null;
  isApplicationOpen?: boolean;
  closesInMs?: number | null;
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
  candidateResponse?: string | null;
  candidateRespondedAt?: string | null;
  offerResponse?: "pending" | "accepted" | "declined" | null;
  offerRespondedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: number | null;
  isWithdrawn?: boolean;
  withdrawnAt?: string | null;
  messageReactions?: Record<string, Record<string, number[]>> | null;
  correspondenceMessages?: Array<{
    id: string;
    authorRole: "candidate" | "lecturer";
    authorId: number;
    body: string;
    createdAt: string;
    editedAt?: string | null;
    deletedAt?: string | null;
    replyToMessageId?: string | null;
  }> | null;
  // Relationships
  course: Course;
  role: Role;
  candidate?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    honorific?: string | null;
    isBlocked: boolean;
    avatarUrl?: string | null;
  };
  commentedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    honorific?: string | null;
    avatarUrl?: string | null;
  };
  rankedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  /** Lecturer has passed initial screening; not a final selection yet. */
  isShortlisted?: boolean;
}

export interface ApplicationStatistics {
  totalApplications: number;
  applicationsByRole: { tutor: number; lab_assistant: number };
  applicationsByCourse: Array<{ course: string; count: number }>;
  applicationsByStatus: {
    pending: number;
    selected: number;
    rejected: number;
    withdrawn?: number;
    ranked?: number;
    shortlisted?: number;
  };
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
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface PaginatedList<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
  ): Promise<ApiResponse<PaginatedList<ApplicationResponse>>> {
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
      if (filters?.page) queryParams.set("page", String(filters.page));
      queryParams.set("pageSize", String(filters?.pageSize ?? 100));
      if (filters?.sortBy) queryParams.set("sortBy", filters.sortBy);
      if (filters?.sortDir) queryParams.set("sortDir", filters.sortDir);

      const url = queryParams.toString()
        ? `/lecturer?${queryParams}`
        : "/lecturer?pageSize=100";

      const response = await applicationAPI.get(url);

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<
        ApiResponse<PaginatedList<ApplicationResponse>>
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

  static async shortlistApplication(
    applicationId: number
  ): Promise<ApiResponse<ApplicationResponse>> {
    try {
      const response = await applicationAPI.post(`/${applicationId}/shortlist`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<ApplicationResponse>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while shortlisting application.",
      };
    }
  }

  static async removeShortlist(
    applicationId: number
  ): Promise<ApiResponse<ApplicationResponse>> {
    try {
      const response = await applicationAPI.delete(`/${applicationId}/shortlist`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<ApplicationResponse>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while removing shortlist.",
      };
    }
  }

  // Comment management methods
  static async markApplicationReviewed(
    applicationId: number
  ): Promise<ApiResponse<ApplicationResponse>> {
    try {
      const response = await applicationAPI.post(`/${applicationId}/review`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<ApplicationResponse>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while marking application reviewed.",
      };
    }
  }

  static async updateApplicationComment(
    applicationId: number,
    comment: string,
    replyToMessageId?: string | null
  ): Promise<ApiResponse<ApplicationResponse>> {
    try {
      const response = await applicationAPI.put(`/${applicationId}/comment`, {
        comment,
        replyToMessageId: replyToMessageId ?? undefined,
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

  static async deleteBlockedApplication(
    applicationId: number
  ): Promise<ApiResponse<void>> {
    try {
      const response = await applicationAPI.delete(`/${applicationId}/blocked`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<void>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while removing application.",
      };
    }
  }

  static async getLecturerNotes(
    applicationId: number
  ): Promise<ApiResponse<{ lecturerNotes: string }>> {
    try {
      const response = await applicationAPI.get(
        `/${applicationId}/lecturer-notes`
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<
        ApiResponse<{ lecturerNotes: string }>
      >;
      if (axiosError.response?.data) return axiosError.response.data;
      return { success: false, message: "Failed to load notes." };
    }
  }

  static async updateLecturerNotes(
    applicationId: number,
    lecturerNotes: string
  ): Promise<ApiResponse<{ lecturerNotes: string | null }>> {
    try {
      const response = await applicationAPI.put(
        `/${applicationId}/lecturer-notes`,
        { lecturerNotes }
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<
        ApiResponse<{ lecturerNotes: string | null }>
      >;
      if (axiosError.response?.data) return axiosError.response.data;
      return { success: false, message: "Failed to save notes." };
    }
  }

  static async respondToOffer(
    applicationId: number,
    decision: "accept" | "decline",
    message: string
  ): Promise<ApiResponse<ApplicationResponse>> {
    try {
      const apiResponse = await applicationAPI.post(
        `/${applicationId}/offer-response`,
        { decision, message }
      );
      return apiResponse.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<ApplicationResponse>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while responding to offer.",
      };
    }
  }

  static async updateCandidateResponse(
    applicationId: number,
    response: string,
    replyToMessageId?: string | null
  ): Promise<ApiResponse<ApplicationResponse>> {
    try {
      const apiResponse = await applicationAPI.put(
        `/${applicationId}/candidate-response`,
        {
          response,
          replyToMessageId: replyToMessageId ?? undefined,
        }
      );
      return apiResponse.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<ApplicationResponse>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while sending response.",
      };
    }
  }

  static async deleteCandidateResponse(
    applicationId: number,
    messageId: string
  ): Promise<ApiResponse<ApplicationResponse>> {
    try {
      const apiResponse = await applicationAPI.delete(
        `/${applicationId}/candidate-response`,
        { data: { messageId } }
      );
      return apiResponse.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<ApplicationResponse>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while deleting message.",
      };
    }
  }

  static async editCorrespondenceMessage(
    applicationId: number,
    messageId: string,
    response: string
  ): Promise<ApiResponse<ApplicationResponse>> {
    try {
      const apiResponse = await applicationAPI.patch(
        `/${applicationId}/candidate-response`,
        { messageId, response }
      );
      return apiResponse.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<ApplicationResponse>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while updating message.",
      };
    }
  }

  static async withdrawApplication(
    applicationId: number
  ): Promise<ApiResponse<ApplicationResponse>> {
    try {
      const apiResponse = await applicationAPI.put(`/${applicationId}/withdraw`);
      return apiResponse.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<ApplicationResponse>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while withdrawing application.",
      };
    }
  }

  static async toggleMessageReaction(
    applicationId: number,
    messageId: string,
    emoji: string
  ): Promise<ApiResponse<ApplicationResponse>> {
    try {
      const apiResponse = await applicationAPI.put(
        `/${applicationId}/message-reactions`,
        { messageId, emoji }
      );
      return apiResponse.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiResponse<ApplicationResponse>>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        message: "Network error occurred while updating reaction.",
      };
    }
  }
}
