// Based on TutorApplication from tutorUtils.ts
export interface Application {
  id: string;
  userId: string; // Foreign key to UserAccount
  email: string; // Denormalized for convenience, or could be fetched via userId
  fullName: string; // Denormalized
  courses: string[]; // Array of course codes user is applying for with this application
  previousRoles?: string[]; // Optional, tutor-specific field
  availability: "Full Time" | "Part Time";
  skills: string[];
  academicCredentials: string;
  dateApplied: string; // ISO date string
  status?: "pending" | "selected" | "rejected";
  selected?: boolean; // Kept for compatibility, but status is preferred
  isShortlisted?: boolean;
  selectedBy?: string; // Lecturer User ID
  selectedDate?: string; // ISO date string
  selectedForCourses?: string[]; // Which specific courses if selected for multiple in one app
  comment?: string; // Lecturer's comment
  rank?: number; // Lecturer's ranking
  rankedForCourse?: string; // Course code this rank applies to
  isBlocked?: boolean; // Whether the candidate is blocked
  isWithdrawn?: boolean;
  avatarUrl?: string | null;
  firstName?: string;
  lastName?: string;
}


