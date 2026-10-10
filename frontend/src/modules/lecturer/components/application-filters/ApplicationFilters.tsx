import React, { useState, useEffect } from 'react';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@/shared/components/common/icons/CloseIcon';
import AppSelect from '@/shared/components/common/app-select/AppSelect';
import styles from './ApplicationFilters.module.css';

interface ApplicationFiltersProps {
  // Basic search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  
  // Course selection
  selectedCourse: string;
  onCourseChange: (course: string) => void;
  courses: Array<{code: string, name: string}>;
  
  // Session type filter (tutorial/lab)
  roleTypeFilter: string;
  onRoleTypeChange: (roleType: string) => void;
  
  // Availability filter
  availabilityFilter: string;
  onAvailabilityChange: (availability: string) => void;
  
  // Skills filter
  skillsFilter: string[];
  onSkillsFilterChange: (skills: string[]) => void;
  availableSkills: string[];
  
  // Status filter
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  
  // Sort options
  sortBy: string;
  onSortChange: (sort: string) => void;
  
  // Clear filters
  onClearFilters: () => void;
  
  // Show active filter count
  activeFilterCount: number;
}

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
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const debouncedSkillSearch = useDebouncedValue(skillSearchQuery, 280);

  // Auto-expand if filters are active
  useEffect(() => {
    if (activeFilterCount > 0) {
      setIsExpanded(true);
    }
  }, [activeFilterCount]);

  // Filter available skills based on search
  const filteredSkills = availableSkills.filter(skill =>
    skill.toLowerCase().includes(debouncedSkillSearch.trim().toLowerCase())
  );

  const handleSkillToggle = (skill: string) => {
    if (skillsFilter.includes(skill)) {
      onSkillsFilterChange(skillsFilter.filter(s => s !== skill));
    } else {
      onSkillsFilterChange([...skillsFilter, skill]);
    }
  };

  const roleTypeOptions = [
    { value: 'all', label: 'All Roles', isDefault: true },
    { value: 'tutor', label: 'Tutor (Tutorial)' },
    { value: 'lab_assistant', label: 'Lab Assistant' },
  ];

  const availabilityOptions = [
    { value: 'all', label: 'All Availability', isDefault: true },
    { value: 'Full Time', label: 'Full Time' },
    { value: 'Part Time', label: 'Part Time' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses', isDefault: true },
    { value: 'pending', label: 'Pending' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'ranked', label: 'Ranked' },
    { value: 'selected', label: 'Selected' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const sortOptions = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'dateApplied', label: 'Date Applied' },
    { value: 'status', label: 'Status' },
    { value: 'skills', label: 'Skill Count' },
  ];

  const courseOptions = [
    { value: 'all', label: 'All Assigned Courses', isDefault: true },
    ...courses.map((course) => ({
      value: course.code,
      label: `${course.code} - ${course.name}`,
    })),
  ];

  return (
    <div
      className={`${styles.applicationFilters__filtersContainer} ${
        isExpanded ? styles.applicationFilters__filtersExpanded : ""
      }`.trim()}
    >
      <div className={styles.applicationFilters__quickSearch}>
        <div className={styles.applicationFilters__quickSearchHead}>
          <div className={styles.applicationFilters__filterSectionTitle}>
            <span className={styles.applicationFilters__filterTitleText}>Filter</span>
            <span className={styles.applicationFilters__filterTitleLine} aria-hidden />
          </div>
          <div className={styles.applicationFilters__quickSearchToolbar}>
          {activeFilterCount > 0 && (
            <>
              <span className={styles.applicationFilters__filterCountBadge}>
                {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={onClearFilters}
                className={styles.applicationFilters__clearButton}
                title="Clear all filters"
              >
                Clear all
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`${styles.applicationFilters__expandButton} ${isExpanded ? styles["applicationFilters--expanded"] : ""}`}
            title={isExpanded ? "Collapse filters" : "Expand filters"}
          >
            <span className={styles.applicationFilters__expandIcon}>{isExpanded ? "▲" : "▼"}</span>
            {isExpanded ? "Fewer filters" : "More filters"}
          </button>
          </div>
        </div>

        <div className={styles.applicationFilters__quickSearchFields}>
        <div className={styles.applicationFilters__searchGroup}>
          <label htmlFor="candidateSearch" className={styles.applicationFilters__fieldLabel}>
            Search by candidate name
          </label>
          <div className={styles.applicationFilters__searchInputWrapper}>
            <input
              id="candidateSearch"
              type="text"
              placeholder="Enter candidate name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={styles.applicationFilters__searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className={`${styles.applicationFilters__clearSearchButton} iconClose__hit iconClose__circle`}
                title="Clear search"
                aria-label="Clear search"
              >
                <CloseIcon size={11} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.applicationFilters__courseGroup}>
          <label htmlFor="courseSelect" className={styles.applicationFilters__fieldLabel}>
            Course
          </label>
          {courses.length > 0 ? (
            <AppSelect
              id="courseSelect"
              value={selectedCourse}
              onChange={onCourseChange}
              options={courseOptions}
              aria-label="Filter by course"
            />
          ) : (
            <div className={styles.applicationFilters__noCoursesMessage}>
              Loading courses...
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Advanced Filters - Expandable */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className={styles.applicationFilters__advancedFilters}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Session Type Filter */}
            <div className={styles.applicationFilters__filterRow}>
              <div className={styles.applicationFilters__filterGroup}>
                <label htmlFor="roleTypeFilter" className={styles.applicationFilters__fieldLabel}>
                  Session Type
                </label>
                <AppSelect
                  id="roleTypeFilter"
                  value={roleTypeFilter}
                  onChange={onRoleTypeChange}
                  options={roleTypeOptions}
                  aria-label="Filter by session type"
                />
              </div>

              <div className={styles.applicationFilters__filterGroup}>
                <label htmlFor="availabilityFilter" className={styles.applicationFilters__fieldLabel}>
                  Availability
                </label>
                <AppSelect
                  id="availabilityFilter"
                  value={availabilityFilter}
                  onChange={onAvailabilityChange}
                  options={availabilityOptions}
                  aria-label="Filter by availability"
                />
              </div>

              <div className={styles.applicationFilters__filterGroup}>
                <label htmlFor="statusFilter" className={styles.applicationFilters__fieldLabel}>
                  Status
                </label>
                <AppSelect
                  id="statusFilter"
                  value={statusFilter}
                  onChange={onStatusFilterChange}
                  options={statusOptions}
                  aria-label="Filter by status"
                />
              </div>

              <div className={styles.applicationFilters__filterGroup}>
                <label htmlFor="sortBy" className={styles.applicationFilters__fieldLabel}>
                  Sort By
                </label>
                <AppSelect
                  id="sortBy"
                  value={sortBy}
                  onChange={onSortChange}
                  options={sortOptions}
                  aria-label="Sort applications"
                />
              </div>
            </div>

            {/* Skills Filter */}
            <div className={styles.applicationFilters__skillsSection}>
              <div className={styles.applicationFilters__skillsFilterBlock}>
                <div className={styles.applicationFilters__skillsHeader}>
                  <label className={styles.applicationFilters__fieldLabel}>
                    Filter by Skills
                    {skillsFilter.length > 0 && (
                      <span className={styles.applicationFilters__skillsCount}>({skillsFilter.length} selected)</span>
                    )}
                  </label>

                  <div className={styles.applicationFilters__skillsControls}>
                    <div className={styles.applicationFilters__skillSearchWrapper}>
                      <input
                        type="text"
                        placeholder="Search skills..."
                        value={skillSearchQuery}
                        onChange={(e) => setSkillSearchQuery(e.target.value)}
                        className={styles.applicationFilters__skillSearchInput}
                      />
                    </div>

                    {skillsFilter.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onSkillsFilterChange([])}
                        className={styles.applicationFilters__clearSkillsButton}
                        title="Clear selected skills"
                      >
                        Clear Skills
                      </button>
                    )}
                  </div>
                </div>

              <div className={styles.applicationFilters__skillsGrid}>
                {filteredSkills.map((skill) => (
                  <label
                    key={skill}
                    className={`${styles.applicationFilters__skillTag} ${
                      skillsFilter.includes(skill) ? styles["applicationFilters--skillSelected"] : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={skillsFilter.includes(skill)}
                      onChange={() => handleSkillToggle(skill)}
                      className={styles.applicationFilters__skillCheckbox}
                    />
                    <span className={styles.applicationFilters__skillName}>{skill}</span>
                  </label>
                ))}
              </div>

              {filteredSkills.length === 0 && debouncedSkillSearch.trim() && (
                <div className={styles.applicationFilters__noSkillsFound}>
                  <p>No skills found matching &quot;{debouncedSkillSearch.trim()}&quot;</p>
                </div>
              )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApplicationFilters; 