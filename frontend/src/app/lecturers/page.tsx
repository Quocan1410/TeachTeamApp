"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import {
  PublicService,
  type PublicOpening,
} from "@/shared/services/publicService";
import type { Lecturer, LecturerCourseAssignment } from "@/shared/types/lecturer";
import LecturerShowcase from "@/modules/home/components/lecturer-showcase/LecturerShowcase";
import LecturerDetailModal from "@/modules/home/components/lecturer-card/LecturerDetailModal";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import styles from "./lecturers.module.css";

const PAGE_SIZE = 9;

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

function searchTerms(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function lecturerMatches(lecturer: Lecturer, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const courses = (lecturer.assignedCourses ?? [])
    .map((course) => `${course.courseCode} ${course.courseName}`)
    .join(" ");
  const haystack = `${lecturer.name} ${lecturer.title} ${courses}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export default function LecturersPage() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [line, setLine] = useState("Hi! Try a name, or a course.");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLecturer, setActiveLecturer] = useState<Lecturer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 280);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lecturerRows, openings] = await Promise.all([
        PublicService.getLecturers(),
        PublicService.getOpenings(),
      ]);
      const window = relevantSemesters(openings);
      setLine(
        window.current && window.next
          ? `I'll show you who teaches ${window.current} and ${window.next}.`
          : window.current
            ? `I'll show you who teaches ${window.current}.`
            : "Hi! Try a name, or a course."
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

  const terms = useMemo(
    () => searchTerms(debouncedSearchQuery),
    [debouncedSearchQuery]
  );

  const visibleLecturers = useMemo(
    () => lecturers.filter((lecturer) => lecturerMatches(lecturer, terms)),
    [lecturers, terms]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(visibleLecturers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageLecturers = visibleLecturers.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const activeIndex = activeLecturer
    ? lecturers.findIndex((lecturer) => lecturer.id === activeLecturer.id)
    : 0;

  return (
    <div className={styles.page}>
      <header className={styles.stage}>
        <div className={styles.intro}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Lecturers</h1>
            <span className={styles.ornament} aria-hidden="true">
              <span className={styles.gem} />
              <span className={styles.dotBlue} />
              <span className={styles.dotGreen} />
            </span>
          </div>
          <p className={styles.line}>{line}</p>
          <label className={styles.search}>
            <MagnifyingGlassIcon className={styles.searchIcon} aria-hidden="true" />
            <input
              className={styles.searchInput}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Name or course"
              aria-label="Search lecturers by name or course"
            />
          </label>
        </div>
        <div className={styles.portrait}>
          <span className={styles.halo} aria-hidden="true" />
          <Image
            src="/mascot/mascot-4.png"
            alt=""
            width={377}
            height={661}
            className={styles.sit}
          />
        </div>
      </header>
      {!loading && !error && lecturers.length > 0 && visibleLecturers.length === 0 ? (
        <div className={styles.miss}>
          <Image
            src="/mascot/mascot-4.png"
            alt=""
            width={377}
            height={661}
            className={styles.missMascot}
          />
          <div>
            <p className={styles.missTitle}>No lecturers match that search.</p>
            <p className={styles.missText}>Try another name or course, or clear the search.</p>
            <button type="button" className={styles.missClear} onClick={() => setSearchQuery("")}>
              Clear search
            </button>
          </div>
        </div>
      ) : (
        <>
          <LecturerShowcase
            lecturers={pageLecturers}
            isLoading={loading}
            error={error}
            onRetry={load}
            onOpenLecturerModal={(lecturerId) => {
              setActiveLecturer(
                lecturers.find((lecturer) => lecturer.id === lecturerId) ?? null
              );
            }}
            showHeading={false}
            layout="directory"
            limit={PAGE_SIZE}
            highlightTerms={terms}
            imageOffset={(safePage - 1) * PAGE_SIZE}
          />
          {totalPages > 1 && (
            <div className={styles.pager}>
              <button
                type="button"
                className={styles.pagerButton}
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
              >
                Previous
              </button>
              <span className={styles.pagerStatus}>
                {safePage} of {totalPages}
              </span>
              <button
                type="button"
                className={styles.pagerButton}
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      <LecturerDetailModal
        lecturer={activeLecturer}
        imageIndex={Math.max(activeIndex, 0)}
        onClose={() => setActiveLecturer(null)}
      />
    </div>
  );
}
