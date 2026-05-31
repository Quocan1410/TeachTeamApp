import React, { useState, useEffect } from 'react';
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

  // Auto-expand if filters are active
  useEffect(() => {
    if (activeFilterCount > 0) {
      setIsExpanded(true);
    }
  }, [activeFilterCount]);

  // Filter available skills based on search
  const filteredSkills = availableSkills.filter(skill =>
    skill.toLowerCase().includes(skillSearchQuery.toLowerCase())
  );

  const handleSkillToggle = (skill: string) => {
    if (skillsFilter.includes(skill)) {
      onSkillsFilterChange(skillsFilter.filter(s => s !== skill));
    } else {
      onSkillsFilterChange([...skillsFilter, skill]);
    }
  };

  const roleTypeOptions = [
    { value: '', label: 'All Roles', isDefault: true },
    { value: 'tutor', label: 'Tutor (Tutorial)' },
    { value: 'lab_assistant', label: 'Lab Assistant' },
  ];

  const availabilityOptions = [
    { value: '', label: 'All Availability', isDefault: true },
    { value: 'Full Time', label: 'Full Time' },
    { value: 'Part Time', label: 'Part Time' },
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses', isDefault: true },
    { value: 'pending', label: 'Pending' },
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
      className={`${styles.filtersContainer} ${
        isExpanded ? styles.filtersExpanded : ""
      }`.trim()}
    >
      <div className={styles.quickSearch}>
        <div className={styles.quickSearchHead}>
          <div className={styles.filterSectionTitle}>
            <span className={styles.filterTitleText}>Filter</span>
            <span className={styles.filterTitleLine} aria-hidden />
          </div>
          <div className={styles.quickSearchToolbar}>
          {activeFilterCount > 0 && (
            <>
              <span className={styles.filterCountBadge}>
                {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={onClearFilters}
                className={styles.clearButton}
                title="Clear all filters"
              >
                Clear all
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`${styles.expandButton} ${isExpanded ? styles.expanded : ""}`}
            title={isExpanded ? "Collapse filters" : "Expand filters"}
          >
            <span className={styles.expandIcon}>{isExpanded ? "▲" : "▼"}</span>
            {isExpanded ? "Fewer filters" : "More filters"}
          </button>
          </div>
        </div>

        <div className={styles.quickSearchFields}>
        <div className={styles.searchGroup}>
          <label htmlFor="candidateSearch" className={styles.fieldLabel}>
            Search by candidate name
          </label>
          <div className={styles.searchInputWrapper}>
            <input
              id="candidateSearch"
              type="text"
              placeholder="Enter candidate name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className={`${styles.clearSearchButton} iconCloseHit iconCloseCircle`}
                title="Clear search"
                aria-label="Clear search"
              >
                <CloseIcon size={11} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.courseGroup}>
          <label htmlFor="courseSelect" className={styles.fieldLabel}>
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
            <div className={styles.noCoursesMessage}>
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
            className={styles.advancedFilters}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Session Type Filter */}
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label htmlFor="roleTypeFilter" className={styles.fieldLabel}>
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

              <div className={styles.filterGroup}>
                <label htmlFor="availabilityFilter" className={styles.fieldLabel}>
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

              <div className={styles.filterGroup}>
                <label htmlFor="statusFilter" className={styles.fieldLabel}>
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

              <div className={styles.filterGroup}>
                <label htmlFor="sortBy" className={styles.fieldLabel}>
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
            <div className={styles.skillsSection}>
              <div className={styles.skillsFilterBlock}>
                <div className={styles.skillsHeader}>
                  <label className={styles.fieldLabel}>
                    Filter by Skills
                    {skillsFilter.length > 0 && (
                      <span className={styles.skillsCount}>({skillsFilter.length} selected)</span>
                    )}
                  </label>

                  <div className={styles.skillsControls}>
                    <div className={styles.skillSearchWrapper}>
                      <input
                        type="text"
                        placeholder="Search skills..."
                        value={skillSearchQuery}
                        onChange={(e) => setSkillSearchQuery(e.target.value)}
                        className={styles.skillSearchInput}
                      />
                    </div>

                    {skillsFilter.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onSkillsFilterChange([])}
                        className={styles.clearSkillsButton}
                        title="Clear selected skills"
                      >
                        Clear Skills
                      </button>
                    )}
                  </div>
                </div>

              <div className={styles.skillsGrid}>
                {filteredSkills.map((skill) => (
                  <label
                    key={skill}
                    className={`${styles.skillTag} ${
                      skillsFilter.includes(skill) ? styles.skillSelected : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={skillsFilter.includes(skill)}
                      onChange={() => handleSkillToggle(skill)}
                      className={styles.skillCheckbox}
                    />
                    <span className={styles.skillName}>{skill}</span>
                  </label>
                ))}
              </div>

              {filteredSkills.length === 0 && skillSearchQuery && (
                <div className={styles.noSkillsFound}>
                  <p>No skills found matching &quot;{skillSearchQuery}&quot;</p>
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