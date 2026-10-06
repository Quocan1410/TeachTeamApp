"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  PublicService,
  type PublicOpening,
} from "@/shared/services/publicService";
import type { Course, Role } from "@/shared/services/applicationService";
import CourseCard from "@/modules/tutor/components/course-card/course-card";
import TutorHeroSection from "@/modules/tutor/components/hero-section/TutorHeroSection";
import SearchFilters, {
  type CourseFilter,
} from "@/modules/tutor/components/search-filters/SearchFilters";
import PaginationBar from "@/shared/components/common/pagination-bar/PaginationBar";
import Modal from "@/shared/components/common/modal/Modal";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import buttonStyles from "@/shared/components/common/Button/Button.module.css";
import tutorStyles from "@/app/tutor/TutorPage.module.css";

const PAGE_SIZE = 9;
const GUEST_ROLES: Role[] = [
  { id: "tutor", roleName: "tutor", description: "Tutor" },
  {
    id: "lab_assistant",
    roleName: "lab_assistant",
    description: "Lab assistant",
  },
];

function toCourse(opening: PublicOpening): Course {
  const deadlineMs = opening.applicationDeadline
    ? new Date(opening.applicationDeadline).getTime()
    : null;
  const closesInMs =
    deadlineMs == null ? null : Math.max(0, deadlineMs - Date.now());
  return {
    id: opening.courseId,
    courseCode: opening.courseCode,
    courseName: opening.courseName,
    semester: opening.semester,
    description:
      opening.lecturers.length > 0
        ? `Taught by ${opening.lecturers.join(", ")}.`
        : "A lecturer has not been assigned yet.",
    maxTutors: opening.maxTutors ?? opening.tutorPlacesLeft,
    maxLabAssistants:
      opening.maxLabAssistants ?? opening.labAssistantPlacesLeft,
    availableTutors: opening.tutorPlacesLeft,
    availableLabAssistants: opening.labAssistantPlacesLeft,
    applicationDeadline: opening.applicationDeadline,
    isApplicationOpen: opening.isApplicationOpen,
    closesInMs,
  };
}

function isOpenCourse(course: Course): boolean {
  return (
    course.isApplicationOpen !== false &&
    (course.availableTutors ?? 0) + (course.availableLabAssistants ?? 0) > 0
  );
}

export default function CoursesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<CourseFilter>("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [page, setPage] = useState(1);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 320);

  const loadOpenings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const openings = await PublicService.getOpenings();
      setCourses(openings.map(toCourse));
    } catch {
      setError("Courses could not be loaded. Try again.");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOpenings();
  }, [loadOpenings]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, activeFilter, sortBy]);

  const filtered = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    const matched = courses.filter((course) => {
      const haystack = `${course.courseCode} ${course.courseName} ${course.description ?? ""}`.toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (activeFilter === "available") return isOpenCourse(course);
      if (activeFilter === "unavailable") return !isOpenCourse(course);
      return true;
    });
    return [...matched].sort((a, b) => {
      if (sortBy === "code") return a.courseCode.localeCompare(b.courseCode);
      if (sortBy === "name") return a.courseName.localeCompare(b.courseName);
      if (isOpenCourse(a) !== isOpenCourse(b)) return isOpenCourse(a) ? -1 : 1;
      return a.courseCode.localeCompare(b.courseCode);
    });
  }, [courses, debouncedSearchQuery, activeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const openCourses = courses.filter(isOpenCourse).length;
  const openPlaces = courses.reduce(
    (sum, course) =>
      sum +
      (course.isApplicationOpen === false
        ? 0
        : (course.availableTutors ?? 0) + (course.availableLabAssistants ?? 0)),
    0
  );

  const handleApply = (course: Course) => {
    if (user?.userType === "lecturer") return;
    if (isAuthenticated && user?.userType === "candidate") {
      router.push("/tutor");
      return;
    }
    setSelected(course);
  };

  if (loading) {
    return <PageSkeleton variant="tutor" />;
  }

  return (
    <>
      <TutorHeroSection
        availableCourses={openCourses}
        userApplications={courses.length}
        openPositions={openPlaces}
        title="Browse courses that need a tutor"
        subtitle="Look through tutor and lab assistant places without an account. Sign in when you are ready to apply."
        statLabels={["Open courses", "Courses listed", "Places open"]}
      />

      <div className={tutorStyles.tutorContainer}>
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          filters={["all", "available", "unavailable"]}
        />

        <div className="container mx-auto px-4 py-8">
          {error && (
            <div className={tutorStyles.emptyStateCard}>
              <p className={tutorStyles.emptyTitle}>{error}</p>
              <button
                type="button"
                className={`${buttonStyles.btn} ${buttonStyles.btnOutline} mt-4`}
                onClick={loadOpenings}
              >
                Try again
              </button>
            </div>
          )}

          {!error && filtered.length === 0 && (
            <div className={tutorStyles.emptyStateCard}>
              <p className={tutorStyles.emptyTitle}>
                No courses match your current filters.
              </p>
            </div>
          )}

          {!error && filtered.length > 0 && (
            <>
              <div
                className={`${tutorStyles.courseGrid} grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6`}
              >
                {visible.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    roles={GUEST_ROLES}
                    myApplications={[]}
                    onApplyForRole={handleApply}
                  />
                ))}
              </div>
              <PaginationBar
                page={page}
                pageSize={PAGE_SIZE}
                totalCount={filtered.length}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title="Sign in to apply"
        maxWidth="480px"
      >
        <div className="px-1 pb-2">
          <p className="mb-5 leading-relaxed text-[var(--color-text-primary)]">
            {selected
              ? `${selected.courseCode} is open, but an application is tied to your account. Sign in first, then choose tutor or lab assistant.`
              : "Sign in before you apply."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signin"
              className={`${buttonStyles.btn} ${buttonStyles.btnPrimary}`}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className={`${buttonStyles.btn} ${buttonStyles.btnOutline}`}
            >
              Create an account
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
}
