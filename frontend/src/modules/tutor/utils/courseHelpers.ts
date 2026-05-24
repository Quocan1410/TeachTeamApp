import type { CourseDetails } from "@/shared/types/courseTypes";
import { availableCourses } from "@/shared/data/courses";
import { availableSkills } from "./skillOptions";

// Function to get random role - client-side display helper
export const getRandomRole = (): "Tutor" | "Lab-Assistant" => {
  return Math.random() > 0.5 ? "Tutor" : "Lab-Assistant";
};

// Function to get random availability - client-side display helper
export const getRandomAvailability = (): "Part Time" | "Full Time" => {
  return Math.random() > 0.5 ? "Part Time" : "Full Time";
};

// Function to get random skills for a course (2-4 skills)
export const getRandomSkills = (): string[] => {
  const shuffled = [...availableSkills].sort(() => 0.5 - Math.random());
  const numSkills = 2 + Math.floor(Math.random() * 3); // 2-4 skills
  return shuffled.slice(0, numSkills);
};

// Function to get courses with random role and availability for tutor application context
export const getCoursesWithDetails = (): CourseDetails[] => {
  return availableCourses.map((course) => ({
    ...course,
    role: getRandomRole(),
    availability: getRandomAvailability(),
    skills: getRandomSkills(),
  }));
};
