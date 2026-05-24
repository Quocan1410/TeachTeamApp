export interface LecturerCourseAssignment {
  courseCode: string;
  courseName: string;
  semester: string;
}

export interface Lecturer {
  id: string;
  name: string;
  title: string;
  specialization: string;
  bio: string;
  courses: string;
  contact: string;
  assignedCourses?: LecturerCourseAssignment[];
  awards?: string;
  experience?: string;
  certifications?: string;
  publications?: string;
  avatarPath?: string;
}
