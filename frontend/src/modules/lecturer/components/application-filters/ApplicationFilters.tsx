import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import CloseIcon from "@/shared/components/common/icons/CloseIcon";
import AppSelect from "@/shared/components/common/app-select/AppSelect";
import styles from "./ApplicationFilters.module.css";

interface ApplicationFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCourse: string;
  onCourseChange: (course: string) => void;
  courses: Array<{ code: string; name: string }>;
  roleTypeFilter: string;
  onRoleTypeChange: (roleType: string) => void;
  availabilityFilter: string;
  onAvailabilityChange: (availability: string) => void;
  skillsFilter: string[];
  onSkillsFilterChange: (skills: string[]) => void;
  availableSkills: string[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

const ROLE_TYPE_OPTIONS = [
  { value: "all", label: "All roles", isDefault: true },
  { value: "tutor", label: "Tutor" },
  { value: "lab_assistant", label: "Lab assistant" },
];

const AVAILABILITY_OPTIONS = [
  { value: "all", label: "All availability", isDefault: true },
  { value: "Full Time", label: "Full time" },
  { value: "Part Time", label: "Part time" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses", isDefault: true },
  { value: "pending", label: "Pending" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "ranked", label: "Ranked" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
];

const SORT_OPTIONS = [
  { value: "none", label: "Default order", isDefault: true },
  { value: "name", label: "Name (A–Z)" },
  { value: "dateApplied", label: "Date applied" },
  { value: "status", label: "Status" },
  { value: "skills", label: "Skill count" },
];

const ApplicationFilters: React.FC<ApplicationFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCourse,
  onCourseChange,
  courses,
  roleTypeFilter,
  onRoleTypeChange,
  availabilityFilter,
  onAvailabilityChange,
  skillsFilter,
  onSkillsFilterChange,
  availableSkills,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  onClearFilters,
  activeFilterCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const debouncedSkillSearch = useDebouncedValue(skillSearchQuery, 280);

  useEffect(() => {
    if (activeFilterCount > 0 && (roleTypeFilter !== "all" || availabilityFilter !== "all" || skillsFilter.length > 0)) {
      setIsExpanded(true);
    }
  }, [activeFilterCount, roleTypeFilter, availabilityFilter, skillsFilter.length]);

  const filteredSkills = availableSkills.filter((skill) =>
    skill.toLowerCase().includes(debouncedSkillSearch.trim().toLowerCase())
  );

  const handleSkillToggle = (skill: string) => {
    if (skillsFilter.includes(skill)) {
      onSkillsFilterChange(skillsFilter.filter((s) => s !== skill));
    } else {
      onSkillsFilterChange([...skillsFilter, skill]);
    }
  };

  const courseOptions = [
    { value: "all", label: "All courses", isDefault: true },
    ...courses.map((course) => ({
      value: course.code,
      label: `${course.code} — ${course.name}`,
    })),
  ];

  const advancedActive =
    (roleTypeFilter && roleTypeFilter !== "all") ||
    (availabilityFilter && availabilityFilter !== "all") ||
    skillsFilter.length > 0;

  return (
    <div data-tour="lecturer-filters" className={styles.applicationFilters}>
      <div className={styles.applicationFilters__toolbar}>
        <div className={styles.applicationFilters__filtersRow}>
          <div className={styles.applicationFilters__searchField}>
            <MagnifyingGlassIcon
              className={styles.applicationFilters__searchIcon}
              aria-hidden="true"
            />
            <input
              id="candidateSearch"
              type="search"
              placeholder="Search candidate name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={styles.applicationFilters__searchInput}
              aria-label="Search by candidate name"
            />
            {searchQuery ? (
              <button
                type="button"
                className={styles.applicationFilters__searchClear}
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
              >
                <CloseIcon size={11} />
              </button>
            ) : null}
          </div>

          {courses.length > 0 ? (
            <AppSelect
              id="courseSelect"
              className={styles.applicationFilters__selectCourse}
              value={selectedCourse}
              onChange={onCourseChange}
              options={courseOptions}
              aria-label="Filter by course"
            />
          ) : (
            <div className={styles.applicationFilters__selectPlaceholder}>
              Loading courses…
            </div>
          )}

          <AppSelect
            id="statusFilter"
            className={styles.applicationFilters__selectStatus}
            value={statusFilter}
            onChange={onStatusFilterChange}
            options={STATUS_OPTIONS}
            aria-label="Filter by status"
          />

          <AppSelect
            id="sortBy"
            className={styles.applicationFilters__selectSort}
            value={sortBy}
            onChange={onSortChange}
            options={SORT_OPTIONS}
            aria-label="Sort applications"
          />
        </div>

        <div className={styles.applicationFilters__toolbarEnd}>
          {activeFilterCount > 0 ? (
            <>
              <span className={styles.applicationFilters__count}>
                {activeFilterCount} active
              </span>
              <button
                type="button"
                onClick={onClearFilters}
                className={styles.applicationFilters__textBtn}
              >
                Clear
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={`${styles.applicationFilters__moreBtn} ${
              isExpanded || advancedActive
                ? styles.applicationFilters__moreBtnActive
                : ""
            }`}
            aria-expanded={isExpanded}
          >
            {isExpanded ? "Fewer filters" : "More filters"}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            className={styles.applicationFilters__advanced}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.applicationFilters__advancedInner}>
              <div className={styles.applicationFilters__advancedRow}>
                <AppSelect
                  id="roleTypeFilter"
                  className={styles.applicationFilters__selectAdvanced}
                  value={roleTypeFilter}
                  onChange={onRoleTypeChange}
                  options={ROLE_TYPE_OPTIONS}
                  aria-label="Filter by role"
                />
                <AppSelect
                  id="availabilityFilter"
                  className={styles.applicationFilters__selectAdvanced}
                  value={availabilityFilter}
                  onChange={onAvailabilityChange}
                  options={AVAILABILITY_OPTIONS}
                  aria-label="Filter by availability"
                />
              </div>

              <div className={styles.applicationFilters__skillsBlock}>
                <div className={styles.applicationFilters__skillsHead}>
                  <span className={styles.applicationFilters__skillsLabel}>
                    Skills
                    {skillsFilter.length > 0
                      ? ` · ${skillsFilter.length} selected`
                      : ""}
                  </span>
                  <div className={styles.applicationFilters__skillsTools}>
                    <div className={styles.applicationFilters__skillSearchField}>
                      <input
                        type="search"
                        placeholder="Search skills…"
                        value={skillSearchQuery}
                        onChange={(e) => setSkillSearchQuery(e.target.value)}
                        className={styles.applicationFilters__skillSearchInput}
                        aria-label="Search skills"
                      />
                    </div>
                    {skillsFilter.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => onSkillsFilterChange([])}
                        className={styles.applicationFilters__textBtn}
                      >
                        Clear skills
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className={styles.applicationFilters__skillsGrid}>
                  {filteredSkills.map((skill) => {
                    const selected = skillsFilter.includes(skill);
                    return (
                      <label
                        key={skill}
                        className={`${styles.applicationFilters__skillTag} ${
                          selected
                            ? styles.applicationFilters__skillTagSelected
                            : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handleSkillToggle(skill)}
                          className={styles.applicationFilters__skillCheckbox}
                        />
                        <span>{skill}</span>
                      </label>
                    );
                  })}
                </div>

                {filteredSkills.length === 0 && debouncedSkillSearch.trim() ? (
                  <p className={styles.applicationFilters__skillsEmpty}>
                    No skills match “{debouncedSkillSearch.trim()}”.
                  </p>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default ApplicationFilters;
