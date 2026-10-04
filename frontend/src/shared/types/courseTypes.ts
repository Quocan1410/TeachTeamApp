export interface Course {
  code: string;
  name: string;
  // Add other base course properties if any, e.g., description, credits
}

// This was CourseWithDetails, perhaps rename to EnrichedCourse or keep as CourseDetails
export interface CourseDetails extends Course {
  role: "Tutor" | "Lab-Assistant"; // Role associated with the course offering/application context
  availability: "Part Time" | "Full Time"; // Availability for the role
  skills?: string[]; // Recommended or required skills for the role
  // Add other details specific to a course offering or application context
}

export interface AssignedCourse {
  id: string;
  courseCode: string;
  courseName: string;
  semester: string;
  assignedAt: Date;
}
