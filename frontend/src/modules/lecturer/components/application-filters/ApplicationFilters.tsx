import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    { value: '', label: 'All Roles' },
    { value: 'tutor', label: 'Tutor (Tutorial)' },
    { value: 'lab_assistant', label: 'Lab Assistant' },
  ];

  const availabilityOptions = [
    { value: '', label: 'All Availability' },
    { value: 'Full Time', label: 'Full Time' },
    { value: 'Part Time', label: 'Part Time' },
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'selected', label: 'Selected' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const sortOptions = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'dateApplied', label: 'Date Applied' },
    { value: 'status', label: 'Status' },
    { value: 'skills', label: 'Skill Count' },
  ];

  return (
    <div className={styles.filtersContainer}>
      {/* Filter Header */}
      <div className={styles.filtersHeader}>
        <div className={styles.headerLeft}>
          <h3 className={styles.filtersTitle}>
            Candidate Filters
            {activeFilterCount > 0 && (
              <span className={styles.filterCount}>{activeFilterCount}</span>
            )}
          </h3>
          <p className={styles.filtersSubtitle}>
            Search and filter candidates by name, role, availability, and skills
          </p>
        </div>
        
        <div className={styles.headerActions}>
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className={styles.clearButton}
              title="Clear all filters"
            >
              Clear All
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`${styles.expandButton} ${isExpanded ? styles.expanded : ''}`}
            title={isExpanded ? 'Collapse filters' : 'Expand filters'}
          >
            <span className={styles.expandIcon}>
              {isExpanded ? '▲' : '▼'}
            </span>
            {isExpanded ? 'Fewer Filters' : 'More Filters'}
          </button>
        </div>
      </div>

      {/* Quick Search - Always Visible */}
      <div className={styles.quickSearch}>
        <div className={styles.searchGroup}>
          <label htmlFor="candidateSearch" className={styles.searchLabel}>
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
                onClick={() => onSearchChange('')}
                className={styles.clearSearchButton}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className={styles.courseGroup}>
          <label htmlFor="courseSelect" className={styles.selectLabel}>
            Course
          </label>
          {courses.length > 0 ? (
            <select
              id="courseSelect"
              value={selectedCourse}
              onChange={(e) => onCourseChange(e.target.value)}
              className={styles.selectInput}
            >
              <option value="all">All Assigned Courses</option>
              {courses.map((course) => (
                <option key={course.code} value={course.code}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          ) : (
            <div className={styles.noCoursesMessage}>
              Loading courses...
            </div>
          )}
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
                <label htmlFor="roleTypeFilter" className={styles.filterLabel}>
                  Session Type
                </label>
                <select
                  id="roleTypeFilter"
                  value={roleTypeFilter}
                  onChange={(e) => onRoleTypeChange(e.target.value)}
                  className={styles.filterSelect}
                >
                  {roleTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="availabilityFilter" className={styles.filterLabel}>
                  Availability
                </label>
                <select
                  id="availabilityFilter"
                  value={availabilityFilter}
                  onChange={(e) => onAvailabilityChange(e.target.value)}
                  className={styles.filterSelect}
                >
                  {availabilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="statusFilter" className={styles.filterLabel}>
                  Status
                </label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange(e.target.value)}
                  className={styles.filterSelect}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="sortBy" className={styles.filterLabel}>
                  Sort By
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value)}
                  className={styles.filterSelect}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Skills Filter */}
            <div className={styles.skillsSection}>
              <div className={styles.skillsHeader}>
                <label className={styles.filterLabel}>
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

            {/* Active Filters Summary */}
            {activeFilterCount > 0 && (
              <div className={styles.activeFilters}>
                <h4 className={styles.activeFiltersTitle}>Active Filters:</h4>
                <div className={styles.activeFiltersList}>
                  {searchQuery && (
                    <span className={styles.activeFilter}>
                      Name: &quot;{searchQuery}&quot;
                      <button onClick={() => onSearchChange('')} className={styles.removeFilter}>✕</button>
                    </span>
                  )}
                  {selectedCourse && (
                    <span className={styles.activeFilter}>
                      Course: {selectedCourse}
                      <button onClick={() => onCourseChange('')} className={styles.removeFilter}>✕</button>
                    </span>
                  )}
                  {roleTypeFilter && (
                    <span className={styles.activeFilter}>
                      Role: {roleTypeOptions.find(opt => opt.value === roleTypeFilter)?.label}
                      <button onClick={() => onRoleTypeChange('')} className={styles.removeFilter}>✕</button>
                    </span>
                  )}
                  {availabilityFilter && (
                    <span className={styles.activeFilter}>
                      Availability: {availabilityFilter}
                      <button onClick={() => onAvailabilityChange('')} className={styles.removeFilter}>✕</button>
                    </span>
                  )}
                  {statusFilter && (
                    <span className={styles.activeFilter}>
                      Status: {statusOptions.find(opt => opt.value === statusFilter)?.label}
                      <button onClick={() => onStatusFilterChange('')} className={styles.removeFilter}>✕</button>
                    </span>
                  )}
                  {skillsFilter.map((skill) => (
                    <span key={skill} className={styles.activeFilter}>
                      Skill: {skill}
                      <button onClick={() => handleSkillToggle(skill)} className={styles.removeFilter}>✕</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApplicationFilters; 