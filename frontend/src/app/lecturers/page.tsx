"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  PublicService,
  type PublicOpening,
} from "@/shared/services/publicService";
import type { Lecturer, LecturerCourseAssignment } from "@/shared/types/lecturer";
import LecturerShowcase from "@/modules/home/components/lecturer-showcase/LecturerShowcase";
import LecturerDetailModal from "@/modules/home/components/lecturer-card/LecturerDetailModal";

function semesterRank(semester: string): number {
  const year = Number(semester.match(/20\d{2}/)?.[0] ?? 0);
  const term = Number(semester.replace(/20\d{2}/, "").match(/\d+/)?.[0] ?? 0);
  return year * 10 + term;
}

function relevantSemesters(openings: PublicOpening[]): {
  current: string | null;
  next: string | null;
} {
  const names = [...new Set(openings.map((opening) => opening.semester))];
  names.sort((a, b) => semesterRank(a) - semesterRank(b));
  const openNames = names.filter((name) =>
    openings.some(
      (opening) => opening.semester === name && opening.isApplicationOpen
    )
  );
  const current =
    openNames[0] ?? (names.length > 0 ? names[names.length - 1] : null);
  if (!current) return { current: null, next: null };
  const currentRank = semesterRank(current);
  const next = names.find((name) => semesterRank(name) > currentRank) ?? null;
  return { current, next };
}

function coursesForWindow(
  courses: LecturerCourseAssignment[],
  current: string | null,
  next: string | null
): LecturerCourseAssignment[] {
  return courses.filter(
    (course) => course.semester === current || course.semester === next
  );
}

export default function LecturersPage() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [subtitle, setSubtitle] = useState(
    "Lecturers assigned to courses, and the subjects they teach."
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLecturer, setActiveLecturer] = useState<Lecturer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lecturerRows, openings] = await Promise.all([
        PublicService.getLecturers(),
        PublicService.getOpenings(),
      ]);
      const window = relevantSemesters(openings);
      setSubtitle(
        window.next
          ? `Courses taught in ${window.current} and ${window.next}.`
          : `Courses taught in ${window.current ?? "the current semester"}.`
      );
      setLecturers(
        lecturerRows
          .map((lecturer) => {
            const assignedCourses = coursesForWindow(
              lecturer.assignedCourses ?? [],
              window.current,
              window.next
            );
            const courseLabels = assignedCourses.map(
              (course) => `${course.courseCode} - ${course.courseName}`
            );
            return {
              ...lecturer,
              assignedCourses,
              courses:
                courseLabels.length > 0
                  ? courseLabels.join(", ")
                  : lecturer.courses,
              specialization:
                assignedCourses.length > 0
                  ? [
                      ...new Set(assignedCourses.map((course) => course.courseName)),
                    ]
                      .slice(0, 2)
                      .join(" · ")
                  : lecturer.specialization,
            };
          })
          .filter((lecturer) => (lecturer.assignedCourses ?? []).length > 0)
      );
    } catch {
      setError("Lecturers could not be loaded. Try again.");
      setLecturers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeIndex = activeLecturer
    ? lecturers.findIndex((lecturer) => lecturer.id === activeLecturer.id)
    : 0;

  return (
    <div className="pt-24">
      <LecturerShowcase
        lecturers={lecturers}
        isLoading={loading}
        error={error}
        onRetry={load}
        onOpenLecturerModal={(lecturerId) => {
          setActiveLecturer(
            lecturers.find((lecturer) => lecturer.id === lecturerId) ?? null
          );
        }}
        title="Meet Our Lecturers"
        subtitle={subtitle}
        limit={Math.max(lecturers.length, 1)}
      />
      <LecturerDetailModal
        lecturer={activeLecturer}
        imageIndex={Math.max(activeIndex, 0)}
        onClose={() => setActiveLecturer(null)}
      />
    </div>
  );
}
