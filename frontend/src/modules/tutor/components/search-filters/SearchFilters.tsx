import React from "react";
import { motion } from "framer-motion";
import SearchInput from "@/shared/components/common/search-input/SearchInput";
import styles from "./SearchFilters.module.css";

export type CourseFilter = "all" | "applied" | "available" | "unavailable";

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: CourseFilter;
  onFilterChange: (filter: CourseFilter) => void;
}

const FILTERS: { id: CourseFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "applied", label: "Applied" },
  { id: "unavailable", label: "Closed" },
];

const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
}) => {
  return (
    <motion.section
      className={styles.searchFiltersContainer}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2 }}
      aria-label="Course search and filters"
    >
      <div className={styles.searchCard}>
        <div className={styles.searchRow}>
          <div className={styles.searchFieldWrap}>
            <SearchInput
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Search courses, codes, positions..."
              showLabel={false}
              variant="rounded"
            />
          </div>
          <div className={styles.filterGroup} role="tablist" aria-label="Course filters">
            <span className={styles.filterLabel}>Filter</span>
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={activeFilter === filter.id}
                className={`${styles.filterPill} ${
                  activeFilter === filter.id ? styles.filterPillActive : ""
                }`}
                onClick={() => onFilterChange(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default SearchFilters;
