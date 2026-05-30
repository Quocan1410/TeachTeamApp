"use client";

import React, { useState, useEffect } from "react";
import {
  ApplicationService,
  Course,
  Role,
  ApplicationData,
  ApplicationResponse,
} from "@/shared/services/applicationService";
import CourseCard from "@/modules/tutor/components/course-card/course-card";
import ApplyModal from "@/modules/tutor/components/apply-modal/apply-modal";
import Toast from "@/shared/components/common/toast/toast";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";
import { useToast } from "@/shared/hooks/useNotification";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useRouter } from "next/navigation";
import TutorHeroSection from "@/modules/tutor/components/hero-section/TutorHeroSection";
import SearchFilters from "@/modules/tutor/components/search-filters/SearchFilters";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useApplicationRealtime } from "@/shared/hooks/useApplicationRealtime";
import { getApplicationApplyBlockMessage } from "@/shared/utils/applicationApplyBlock";
import type { ApplicationUpdatedPayload } from "@/shared/socket/applicationEvents";

import styles from "./TutorPage.module.css";

const TutorDashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Data state
  const [courses, setCourses] = useState<Course[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [myApplications, setMyApplications] = useState<ApplicationResponse[]>(
    []
  );
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "applied" | "available" | "unavailable"
  >("all");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 320);

  // Toast notifications
  const {
    toast: successToast,
    showSuccess,
    hideToast: hideSuccess,
  } = useToast();
  const { toast: errorToast, showError, hideToast: hideError } = useToast();

  const isCandidate = user?.userType === "candidate";

  // Authentication and authorization check (client navigation — not redirect())
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      router.replace("/signin");
      return;
    }

    if (user.userType !== "candidate") {
      router.replace(user.userType === "lecturer" ? "/lecturer" : "/");
    }
  }, [user, isAuthenticated, authLoading, router]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!user || user.userType !== "candidate") {
        setIsDataLoading(false);
        return;
      }

      try {
        setIsDataLoading(true);

        // Load courses, roles, and user's applications in parallel
        const [coursesResponse, applicationsResponse] = await Promise.all([
          ApplicationService.getCoursesAndRoles(),
          ApplicationService.getMyCandidateApplications(),
        ]);

        if (coursesResponse.success && coursesResponse.data) {
          setCourses(coursesResponse.data.courses);
          setRoles(coursesResponse.data.roles);
        } else {
          showError(
            coursesResponse.message || "Failed to load courses and roles"
          );
        }

        if (applicationsResponse.success && applicationsResponse.data) {
          setMyApplications(applicationsResponse.data);
        } else {
          showError(
            applicationsResponse.message || "Failed to load your applications"
          );
        }
      } catch (error) {
        console.error("Error loading data:", error);
        showError("Failed to load dashboard data. Please try again.");
      } finally {
        setIsDataLoading(false);
      }
    };

    void loadData();
  }, [user, showError]);

  // Function to refresh course data (useful after application status changes)
  const refreshCourseData = async () => {
    try {
      const coursesResponse = await ApplicationService.getCoursesAndRoles();
      if (coursesResponse.success && coursesResponse.data) {
        setCourses(coursesResponse.data.courses);
      }
    } catch (error) {
      console.error("Error refreshing course data:", error);
      // Don't show error to user as this is background refresh
    }
  };

  const refreshApplicationsAndCourses = React.useCallback(async () => {
    try {
      const [coursesResponse, applicationsResponse] = await Promise.all([
        ApplicationService.getCoursesAndRoles(),
        ApplicationService.getMyCandidateApplications(),
      ]);

      if (coursesResponse.success && coursesResponse.data) {
        setCourses(coursesResponse.data.courses);
      }

      if (applicationsResponse.success && applicationsResponse.data) {
        setMyApplications(applicationsResponse.data);
      }
    } catch (error) {
      console.error("Error refreshing tutor dashboard data:", error);
    }
  }, []);

  const handleApplicationRealtimeUpdate = React.useCallback(
    (payload: ApplicationUpdatedPayload) => {
      const { application, reason } = payload;

      setMyApplications((prev) => {
        const index = prev.findIndex((item) => item.id === application.id);
        if (index === -1) {
          return reason === "created" ? [application, ...prev] : prev;
        }
        const next = [...prev];
        next[index] = application;
        return next;
      });

      if (reason === "status" && application.status === "selected") {
        showSuccess(
          `Congratulations! You've been selected for ${application.course?.courseCode}!`
        );
      }

      void refreshApplicationsAndCourses();
    },
    [refreshApplicationsAndCourses, showSuccess]
  );

  useApplicationRealtime({
    enabled:
      !authLoading &&
      isAuthenticated &&
      isCandidate &&
      !isDataLoading,
    onApplicationUpdated: handleApplicationRealtimeUpdate,
  });

  // Calculate comprehensive statistics
  const getComprehensiveStats = () => {
    const totalRoleCourseCombinations = courses.length * roles.length;
    const appliedCombinations = myApplications.length;

    // Calculate available opportunities (role-course combinations the user can apply for)
    let availableOpportunities = 0;

    courses.forEach((course) => {
      roles.forEach((role) => {
        const hasApplied = myApplications.some(
          (app) => app.courseId === course.id && app.roleId === role.id
        );

        if (!hasApplied) {
          availableOpportunities += 1; // Count each role-course combination as one opportunity
        }
      });
    });

    return {
      totalCourses: courses.length,
      totalApplications: myApplications.length,
      availableOpportunities, // Number of role-course combinations user can still apply for
      completionRate:
        totalRoleCourseCombinations > 0
          ? Math.round(
              (appliedCombinations / totalRoleCourseCombinations) * 100
            )
          : 0,
    };
  };

  const stats = getComprehensiveStats();

  // Check if user has applied to any role in a course
  const hasAppliedToCourse = React.useCallback(
    (courseId: number) => {
      return myApplications.some((app) => app.courseId === courseId);
    },
    [myApplications]
  );

  // Smart search utility functions
  const fuzzyMatch = React.useCallback(
    (text: string, query: string): number => {
      // Simple fuzzy matching - returns score between 0 and 1
      const textLower = text.toLowerCase();
      const queryLower = query.toLowerCase();

      // Exact match gets highest score
      if (textLower.includes(queryLower)) return 1.0;

      // Character-level fuzzy matching for typos
      let score = 0;
      let queryIndex = 0;

      for (
        let i = 0;
        i < textLower.length && queryIndex < queryLower.length;
        i++
      ) {
        if (textLower[i] === queryLower[queryIndex]) {
          score++;
          queryIndex++;
        }
      }

      return queryIndex === queryLower.length
        ? (score / queryLower.length) * 0.8
        : 0;
    },
    []
  );

  const normalizeSearchTerm = React.useCallback(
    (term: string): string[] => {
      // Handle common variations and synonyms
      const synonyms: { [key: string]: string[] } = {
        tutor: ["tutor", "tutorial", "tutoring", "teach", "instructor"],
        lab: ["lab", "laboratory", "practical", "workshop"],
        assistant: ["assistant", "aide", "helper", "support"],
        programming: ["programming", "coding", "development", "software"],
        data: ["data", "database", "information"],
        web: ["web", "website", "internet", "online"],
        systems: ["systems", "system", "infrastructure"],
        advanced: ["advanced", "senior", "higher", "level"],
      };

      const normalized = term.toLowerCase().trim();

      // Check if term matches any synonym group
      for (const [, values] of Object.entries(synonyms)) {
        if (values.some((synonym) => fuzzyMatch(synonym, normalized) > 0.7)) {
          return values;
        }
      }

      return [normalized];
    },
    [fuzzyMatch]
  );

  const calculateSearchScore = React.useCallback(
    (course: Course, searchTerms: string[]): number => {
      let totalScore = 0;
      const weights = {
        courseCode: 0.9,
        courseName: 1.0,
        description: 0.7,
        semester: 0.5,
        positions: 1.2, // Higher weight for position-related matches
      };

      searchTerms.forEach((term) => {
        const normalizedTerms = normalizeSearchTerm(term);

        normalizedTerms.forEach((normalizedTerm) => {
          // Position-specific scoring
          if (
            ["tutor", "tutorial", "tutoring", "teach", "instructor"].includes(
              normalizedTerm
            )
          ) {
            const hasAvailableTutors =
              course.availableTutors !== undefined
                ? course.availableTutors > 0
                : course.maxTutors > 0;
            if (hasAvailableTutors) totalScore += weights.positions;
          }

          if (
            [
              "lab",
              "laboratory",
              "assistant",
              "aide",
              "helper",
              "practical",
            ].includes(normalizedTerm)
          ) {
            const hasAvailableLabAssistants =
              course.availableLabAssistants !== undefined
                ? course.availableLabAssistants > 0
                : course.maxLabAssistants > 0;
            if (hasAvailableLabAssistants) totalScore += weights.positions;
          }

          // General content scoring
          totalScore +=
            fuzzyMatch(course.courseCode, normalizedTerm) * weights.courseCode;
          totalScore +=
            fuzzyMatch(course.courseName, normalizedTerm) * weights.courseName;
          totalScore +=
            fuzzyMatch(course.semester, normalizedTerm) * weights.semester;

          if (course.description) {
            totalScore +=
              fuzzyMatch(course.description, normalizedTerm) *
              weights.description;
          }
        });
      });

      return totalScore;
    },
    [fuzzyMatch, normalizeSearchTerm]
  );

  // Enhanced filter courses with smart search
  const filteredCourses = React.useMemo(() => {
    const coursesWithScores = courses.map((course) => {
      const hasAvailablePositions =
        (course.availableTutors !== undefined
          ? course.availableTutors > 0
          : course.maxTutors > 0) ||
        (course.availableLabAssistants !== undefined
          ? course.availableLabAssistants > 0
          : course.maxLabAssistants > 0);

      let searchScore = 0;
      let matchesSearch = true;

      if (debouncedSearchQuery.trim()) {
        const searchTerms = debouncedSearchQuery
          .trim()
          .split(/\s+/)
          .filter((term) => term.length > 0);

        searchScore = calculateSearchScore(course, searchTerms);

        // Only show courses with enough relevance when searching.
        // Availability filtering is handled by active filter logic below.
        matchesSearch = searchScore > 0.3;
      } else {
        // No search query - keep all courses, then apply active filter.
        matchesSearch = true;
        searchScore = 1;
      }

      let matchesFilter = true;

      switch (activeFilter) {
        case "available":
          matchesFilter = !hasAppliedToCourse(course.id);
          break;
        case "applied":
          matchesFilter = hasAppliedToCourse(course.id);
          break;
        case "unavailable":
          matchesFilter =
            !hasAvailablePositions && !hasAppliedToCourse(course.id);
          break;
        case "all":
        default:
          matchesFilter = true;
          break;
      }

      return {
        course,
        score: searchScore,
        matches: matchesSearch && matchesFilter,
      };
    });

    // Filter and sort by relevance score
    return coursesWithScores
      .filter((item) => item.matches)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.course);
  }, [
    courses,
    debouncedSearchQuery,
    activeFilter,
    hasAppliedToCourse,
    calculateSearchScore,
  ]);

  const openApplyModal = (course: Course, role: Role) => {
    if (!user) {
      showError("You must be logged in to apply for courses.");
      return;
    }

    // Check if user has already applied for this specific role-course combination
    const existingApplication = myApplications.find(
      (app) => app.courseId === course.id && app.roleId === role.id
    );

    if (existingApplication) {
      showError(getApplicationApplyBlockMessage(existingApplication));
      return;
    }

    setSelectedCourse(course);
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const closeApplyModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
    setSelectedRole(null);
  };

  const handleSubmitApplication = async (applicationData: ApplicationData) => {
    if (!user || !selectedCourse || !selectedRole) {
      showError("Missing required information to submit application.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Submit application to backend
      const response =
        await ApplicationService.createApplication(applicationData);

      if (response.success && response.data) {
        // Add new application to local state
        setMyApplications((prev) => [...prev, response.data!]);

        // Close modal and show success message
        setIsModalOpen(false);
        showSuccess(`Application submitted for ${selectedCourse.courseCode}!`);

        // Refresh course data to get updated position availability
        await refreshCourseData();

        // Clear the success message after 3 seconds
        setTimeout(() => {
          hideSuccess();
        }, 3000);
      } else {
        showError(
          response.message ||
            "Failed to submit your application. Please try again."
        );
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      showError("Failed to submit your application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !isAuthenticated || !user || !isCandidate) {
    return <PageSkeleton variant="tutor" />;
  }

  if (isDataLoading) {
    return <PageSkeleton variant="tutor" />;
  }

  return (
    <>
      {/* Hero Section with improved statistics */}
      <TutorHeroSection
        totalCourses={stats.totalCourses}
        userApplications={stats.totalApplications}
        availableOpportunities={stats.availableOpportunities}
      />

      {/* Main Content */}
      <main className={`flex-grow pt-0 ${styles.tutorContainer}`}>
        {/* Success/Error Messages */}
        <Toast
          message={successToast.message}
          type={successToast.type}
          visible={successToast.visible}
          onClose={hideSuccess}
          variant="toast"
          position="bottom-left"
          autoClose={true}
          autoCloseDelay={5000}
        />

        <Toast
          message={errorToast.message}
          type={errorToast.type}
          visible={errorToast.visible}
          onClose={hideError}
          variant="toast"
          position="bottom-left"
          autoClose={false}
        />

        {/* Search and Filters */}
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {/* Course Cards Grid - Modified to show 3 cards per row */}
        <div className="container mx-auto px-4 py-8">
          {filteredCourses.length === 0 ? (
            <div className={styles.emptyStateCard}>
              <p className={styles.emptyTitle}>
                {debouncedSearchQuery || activeFilter !== "all"
                  ? "No courses match your current filters."
                  : "No courses available at the moment."}
              </p>
              {activeFilter === "available" && myApplications.length > 0 && (
                <p className={styles.emptySubtitle}>
                  You have applied to all available courses. Check the
                  &quot;Applied&quot; filter to see your applications.
                </p>
              )}
              {activeFilter === "applied" && myApplications.length === 0 && (
                <p className={styles.emptySubtitle}>
                  You haven&apos;t applied to any courses yet. Check the
                  &quot;Available&quot; filter to see opportunities.
                </p>
              )}
              {activeFilter === "unavailable" && (
                <p className={styles.emptySubtitle}>
                  Nice progress. There are no fully closed courses left for you
                  right now, or you already applied for them.
                </p>
              )}
            </div>
          ) : (
            <div
              className={`${styles.courseGrid} grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6`}
            >
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  roles={roles}
                  myApplications={myApplications}
                  onApplyForRole={openApplyModal}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Apply Modal */}
      <ApplyModal
        isOpen={isModalOpen}
        course={selectedCourse}
        role={selectedRole}
        onClose={closeApplyModal}
        onSubmit={handleSubmitApplication}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default TutorDashboardPage;
