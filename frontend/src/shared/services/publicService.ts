import axios from "axios";
import type { Lecturer } from "@/shared/types/lecturer";
import { env } from "@/lib/env";

const publicAPI = axios.create({
  baseURL: `${env.apiEndpoint}/public`,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface PublicLecturerCourse {
  courseCode: string;
  courseName: string;
  semester: string;
}

export interface PublicLecturerDto {
  id: string;
  name: string;
  title: string;
  specialization: string;
  bio: string;
  courses: string;
  contact: string;
  yearsExperience?: number;
  avatarPath?: string;
  assignedCourses: PublicLecturerCourse[];
}

interface PublicLecturersResponse {
  success: boolean;
  data?: { lecturers: PublicLecturerDto[] };
  message?: string;
}

export function mapPublicLecturerToDisplay(dto: PublicLecturerDto): Lecturer {
  return {
    id: dto.id,
    name: dto.name,
    title: dto.title,
    specialization: dto.specialization,
    bio: dto.bio,
    courses: dto.courses,
    contact: dto.contact,
    yearsExperience: dto.yearsExperience,
    avatarPath: dto.avatarPath,
    assignedCourses: dto.assignedCourses,
  };
}

export interface PublicOpening {
  courseId: string;
  courseCode: string;
  courseName: string;
  semester: string;
  maxTutors: number;
  maxLabAssistants: number;
  applicationDeadline: string | null;
  isApplicationOpen: boolean;
  tutorPlacesLeft: number;
  labAssistantPlacesLeft: number;
  lecturers: string[];
}

interface PublicOpeningsResponse {
  success: boolean;
  data?: { openings: PublicOpening[] };
  message?: string;
}

export class PublicService {
  static async getOpenings(): Promise<PublicOpening[]> {
    const response = await publicAPI.get<PublicOpeningsResponse>("/openings");
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.message || "Failed to load open roles from server"
      );
    }
    return response.data.data.openings;
  }

  static async getLecturers(): Promise<Lecturer[]> {
    const response = await publicAPI.get<PublicLecturersResponse>("/lecturers");
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.message || "Failed to load lecturers from server"
      );
    }
    return response.data.data.lecturers.map(mapPublicLecturerToDisplay);
  }
}
