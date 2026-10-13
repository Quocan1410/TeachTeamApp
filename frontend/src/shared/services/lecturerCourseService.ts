import { createApiClient, getAxiosErrorData } from "./apiClient";

const lecturerCourseAPI = createApiClient("/lecturer/courses");

export type LecturerSessionType = "lecture" | "tutorial";

export type LecturerCourseSession = {
  id?: string;
  courseId?: string;
  sessionType: LecturerSessionType;
  dayOfWeek: number;
  dayLabel?: string;
  startTime: string;
  endTime: string;
  location: string | null;
  capacity: number | null;
  sortOrder?: number;
};

export type LecturerCoursePendingRequest = {
  id: string;
  requestType: "content" | "capacity" | "schedule";
  status: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type LecturerManagedCourse = {
  id: string;
  courseCode: string;
  courseName: string;
  semester: string;
  description: string;
  maxTutors: number;
  maxLabAssistants: number;
  studentsPerClass: number;
  isPublished: boolean;
  applicationDeadline?: string | null;
  sessions: LecturerCourseSession[];
  pendingRequests: LecturerCoursePendingRequest[];
};

export type TimetableEntry = LecturerCourseSession & {
  courseCode: string;
  courseName: string;
  semester: string;
  isPublished: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<{
  success: boolean;
  message: string;
  data?: T;
}> {
  try {
    const response = await promise;
    return {
      success: response.data.success,
      message: response.data.message || "",
      data: response.data.data,
    };
  } catch (error) {
    const data = getAxiosErrorData<ApiEnvelope<T>>(error);
    return {
      success: false,
      message: data?.message || "Request failed",
      data: data?.data,
    };
  }
}

export const LecturerCourseService = {
  listAssigned(semester?: string) {
    return unwrap<{ courses: LecturerManagedCourse[] }>(
      lecturerCourseAPI.get("/", {
        params: semester ? { semester } : undefined,
      })
    );
  },

  getTimetable() {
    return unwrap<{ entries: TimetableEntry[] }>(
      lecturerCourseAPI.get("/timetable")
    );
  },

  updateCourse(
    courseId: string,
    body: {
      description?: string;
      maxTutors?: number;
      maxLabAssistants?: number;
      studentsPerClass?: number;
    }
  ) {
    return unwrap<{
      courseId: string;
      requiresApproval: boolean;
      requestIds?: string[];
    }>(lecturerCourseAPI.patch(`/${courseId}`, body));
  },

  saveSessions(courseId: string, sessions: LecturerCourseSession[]) {
    return unwrap<{
      requiresApproval: boolean;
      requestId?: string;
      sessions?: LecturerCourseSession[];
    }>(
      lecturerCourseAPI.put(`/${courseId}/sessions`, {
        sessions: sessions.map((session) => ({
          sessionType: session.sessionType,
          dayOfWeek: session.dayOfWeek,
          startTime: session.startTime,
          endTime: session.endTime,
          location: session.location,
          capacity: session.capacity,
        })),
      })
    );
  },
};
