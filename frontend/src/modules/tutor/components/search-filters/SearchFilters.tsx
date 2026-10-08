import React from "react";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import AppSelect from "@/shared/components/common/app-select/AppSelect";
import styles from "./SearchFilters.module.css";

export type CourseFilter = "all" | "applied" | "available" | "unavailable" | "soon";
export type CourseRoleFilter = "all" | "tutor" | "lab";
export type CourseSortOrder = "asc" | "desc";

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  status: CourseFilter;
  onStatusChange: (status: CourseFilter) => void;
  role: CourseRoleFilter;
  onRoleChange: (role: CourseRoleFilter) => void;
  sortOrder: CourseSortOrder;
  onSortOrderChange: (order: CourseSortOrder) => void;
  onClear: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchQuery,
  onSearchChange,
  status,
  onStatusChange,
  role,
  onRoleChange,
  sortOrder,
  onSortOrderChange,
  onClear,
}) => {
  return (
    <section className={styles.panel} aria-label="Search courses">
      <div className={styles.panelHead}>
        <h2 className={styles.panelTitle}>Search courses</h2>
        <button type="button" className={styles.clearLink} onClick={onClear}>
          Clear filters
        </button>
      </div>

      <form
        className={styles.field}
        onSubmit={(event) => {
          event.preventDefault();
          document.getElementById("course-results")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }}
      >
        <input
          className={styles.fieldInput}
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search course, code, or role"
          aria-label="Search course, code, or role"
        />
        <MagnifyingGlassIcon className={styles.fieldIcon} aria-hidden="true" />
      </form>

      <div className={styles.filterHead}>
        <p className={styles.filterLabel}>Filter courses</p>
      </div>
      <div className={styles.filterRow}>
        <AppSelect
          className={styles.filterSelect}
          id="course-status"
          aria-label="Status"
          value={status}
          onChange={(value) => onStatusChange(value as CourseFilter)}
          options={[
            { value: "all", label: "All statuses" },
            { value: "available", label: "Available" },
            { value: "applied", label: "Applied" },
            { value: "unavailable", label: "Closed" },
            { value: "soon", label: "Closing soon" },
          ]}
        />
        <AppSelect
          className={styles.filterSelect}
          id="course-role"
          aria-label="Role"
          value={role}
          onChange={(value) => onRoleChange(value as CourseRoleFilter)}
          options={[
            { value: "all", label: "All roles" },
            { value: "tutor", label: "Tutor" },
            { value: "lab", label: "Lab assistant" },
          ]}
        />
        <AppSelect
          className={styles.filterSelect}
          id="course-order"
          aria-label="Order"
          value={sortOrder}
          onChange={(value) => onSortOrderChange(value as CourseSortOrder)}
          options={[
            { value: "asc", label: "Course code A–Z" },
            { value: "desc", label: "Course code Z–A" },
          ]}
        />
      </div>

      <button
        type="button"
        className={styles.applyButton}
        onClick={() => {
          document.getElementById("course-results")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }}
      >
        Apply filters
      </button>

      <div className={styles.notice}>
        <p>Heart a course to apply later. We remind you when about a month is left.</p>
        <Link href="/tutor/applications" className={styles.noticeLink}>
          Your applications
        </Link>
      </div>
    </section>
  );
};

export default SearchFilters;
