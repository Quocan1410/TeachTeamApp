"use client";

import React from "react";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import AppSelect from "@/shared/components/common/app-select/AppSelect";
import styles from "./CoursesSearchFilters.module.css";

export type LecturerCourseFilter = "all" | "published" | "draft" | "pending";
export type LecturerCourseSort = "name" | "code" | "sessions";

interface CoursesSearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  status: LecturerCourseFilter;
  onStatusChange: (status: LecturerCourseFilter) => void;
  sortBy: LecturerCourseSort;
  onSortByChange: (sort: LecturerCourseSort) => void;
  onClear: () => void;
}

/** Live filters in the hero search column — no Apply CTA (filters apply as you change them). */
const CoursesSearchFilters: React.FC<CoursesSearchFiltersProps> = ({
  searchQuery,
  onSearchChange,
  status,
  onStatusChange,
  sortBy,
  onSortByChange,
  onClear,
}) => {
  return (
    <section className={styles.panel} aria-label="Search courses">
      <div className={styles.head}>
        <h2 className={styles.title}>Your courses</h2>
        <button type="button" className={styles.clear} onClick={onClear}>
          Clear
        </button>
      </div>

      <div className={styles.field}>
        <input
          className={styles.input}
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by code, name, or semester"
          aria-label="Search courses"
        />
        <MagnifyingGlassIcon className={styles.icon} aria-hidden="true" />
      </div>

      <div className={styles.row}>
        <AppSelect
          className={styles.select}
          id="lecturer-course-status"
          aria-label="Status"
          value={status}
          onChange={(value) => onStatusChange(value as LecturerCourseFilter)}
          options={[
            { value: "all", label: "All statuses" },
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
            { value: "pending", label: "Pending" },
          ]}
        />
        <AppSelect
          className={styles.select}
          id="lecturer-course-sort"
          aria-label="Sort"
          value={sortBy}
          onChange={(value) => onSortByChange(value as LecturerCourseSort)}
          options={[
            { value: "name", label: "Name A–Z" },
            { value: "code", label: "Code A–Z" },
            { value: "sessions", label: "Most sessions" },
          ]}
        />
      </div>

      <p className={styles.hint}>
        Need applicants?{" "}
        <Link href="/lecturer">Open Applicants</Link>
      </p>
    </section>
  );
};

export default CoursesSearchFilters;
