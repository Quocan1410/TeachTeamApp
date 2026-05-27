"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  ApplicationService,
  ApplicationResponse,
} from "@/shared/services/applicationService";
import { Application } from "@/shared/types/application";
import ApplicantList from "@/modules/lecturer/components/applicant-list/applicant-list";
import ApplicantDetails from "@/modules/lecturer/components/applicant-details/applicant-details";
import RankedCandidates from "@/modules/lecturer/components/ranked-candidates/ranked-candidates";
import Toast from "@/shared/components/common/toast/toast";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";
import { useLecturerAuth } from "@/modules/lecturer/hooks/useLecturerAuth";
import { useApplicationManagement } from "@/modules/lecturer/hooks/useApplicationManagement";
import DashboardHeader from "@/modules/lecturer/components/dashboard-header/DashboardHeader";
import DashboardTabs from "@/modules/lecturer/components/dashboard-tabs/DashboardTabs";
import ApplicationFilters from "@/modules/lecturer/components/application-filters/ApplicationFilters";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { redirect } from "next/navigation";
import styles from "./LecturerPage.module.css";
import { useCandidateBlockingSubscription } from "@/hooks/useCandidateBlockingSubscription";

const KanbanBoard = dynamic(
  () => import("@/modules/lecturer/components/kanban-board/KanbanBoard"),
  { ssr: false }
);
const ApplicantStatsVisualization = dynamic(
  () =>
    import(
      "@/modules/lecturer/components/applicant-stats-visualization/applicant-stats-visualization"
    ),
  { ssr: false }
);
const ComparePanel = dynamic(
  () => import("@/modules/lecturer/components/compare-panel/ComparePanel"),
  { ssr: false }
);
const AdminApolloProvider = dynamic(
  () =>
    import("@/components/AdminApolloProvider").then((m) => ({
      default: m.AdminApolloProvider,
    })),
  { ssr: false }
);
import { CandidateBlockedEvent } from "@/lib/graphql-subscriptions";

type TabType = "applications" | "rankings" | "stats";

// Adapter function to convert ApplicationResponse to Application
const convertToLegacyApplication = (
  appResponse: ApplicationResponse
): Application & {
  role?: { roleName: string };
  course?: { courseCode: string; courseName: string; semester: string };
  rankedForCourse?: string;
  isBlocked?: boolean;
} => {
  const availabilityValue =
    (appResponse.availability as { type: string })?.type || "Part Time";
  const availability: "Full Time" | "Part Time" =
    availabilityValue === "Full Time" ? "Full Time" : "Part Time";

  return {
    id: appResponse.id.toString(),
    userId: appResponse.candidateId.toString(),
    email: appResponse.candidate?.email || "",
    fullName:
      `${appResponse.candidate?.firstName || ""} ${appResponse.candidate?.lastName || ""}`.trim(),
    courses: [appResponse.course.courseCode],
    availability,
    skills: appResponse.skills
      ? appResponse.skills.split(",").map((s) => s.trim())
      : [],
    academicCredentials: appResponse.experience || "",
    dateApplied: appResponse.appliedAt,
    status: appResponse.status as
      | "pending"
      | "shortlisted"
      | "selected"
      | "rejected",
    selected: appResponse.status === "selected",
    comment: appResponse.comment || "",
    rank: appResponse.rank,
    role: appResponse.role
      ? { roleName: appResponse.role.roleName }
      : undefined,
    course: appResponse.course
      ? {
          courseCode: appResponse.course.courseCode,
          courseName: appResponse.course.courseName,
          semester: appResponse.course.semester,
        }
      : undefined,
    selectedForCourses:
      appResponse.status === "selected"
        ? [appResponse.course.courseCode]
        : undefined,
    rankedForCourse: appResponse.rankedForCourse,
    isBlocked: appResponse.candidate?.isBlocked || false,
  };
};

// Convert statistics to legacy format
const convertToLegacyStatistics = (stats: unknown) => {
  if (!stats || typeof stats !== "object") {
    return {
      totalApplications: 0,
      selectedTutorApplications: 0,
      pendingTutorApplications: 0,
      selectionRate: 0,
    };
  }

  const typedStats = stats as {
    totalApplications?: number;
    applicationsByStatus?: { selected?: number; pending?: number };
  };

  return {
    totalApplications: typedStats.totalApplications || 0,
    selectedTutorApplications: typedStats.applicationsByStatus?.selected || 0,
    pendingTutorApplications: typedStats.applicationsByStatus?.pending || 0,
    selectionRate:
      typedStats.totalApplications && typedStats.totalApplications > 0
        ? Math.round(
            ((typedStats.applicationsByStatus?.selected || 0) /
              typedStats.totalApplications) *
              100
          )
        : 0,
  };
};

const LecturerDashboardInner: React.FC = () => {
  // Authentication
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { lecturerName } = useLecturerAuth();

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>("applications");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "success"
  );

  // Show toast function
  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      setToastMessage(null);
      setTimeout(() => {
        setToastMessage(message);
        setToastType(type);
      }, 10);
    },
    []
  );

  // Application management with enhanced filtering
  const {
    applications: rawApplications,
    statistics: rawStatistics,
    isInitialized,
    selectedApplication: rawSelectedApplication,
    setSelectedApplication: setRawSelectedApplication,
    comment,
    setComment,
    rankedApplications: rawRankedApplications,
    selectedCourse,
    setSelectedCourse,
    selectedRankingCourse,
    setSelectedRankingCourse,
    searchQuery,
    setSearchQuery,
    roleTypeFilter,
    setRoleTypeFilter,
    availabilityFilter,
    setAvailabilityFilter,
    skillsFilter,
    setSkillsFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    loadApplications,
    handleSelectApplication: rawHandleSelectApplication,
  } = useApplicationManagement();

  // Memoize the callback function to prevent excessive re-initializations
  const onCandidateBlocked = useCallback(
    (event: CandidateBlockedEvent) => {
      const shouldReceiveNotification =
        user?.userType === "lecturer" &&
        event.affectedLecturerIds &&
        event.affectedLecturerIds.includes(user.id);

      if (shouldReceiveNotification) {
        if (event.isBlocked) {
          const unselectedCount = event.unselectedApplicationsCount || 0;
          const unrankedCount = event.unrankedApplicationsCount || 0;

          let message = `${event.candidateName} blocked`;
          if (unselectedCount > 0 || unrankedCount > 0) {
            const details = [];
            if (unselectedCount > 0)
              details.push(
                `${unselectedCount} application${unselectedCount === 1 ? "" : "s"} unselected`
              );
            if (unrankedCount > 0)
              details.push(
                `${unrankedCount} ranking${unrankedCount === 1 ? "" : "s"} removed`
              );
            message += ` - ${details.join(", ")}`;
          }

          showToast(message, "info");
        } else {
          showToast(`${event.candidateName} unblocked`, "success");
        }
      }

      const isCurrentlySelectedAffected =
        rawSelectedApplication &&
        rawSelectedApplication.candidateId === event.candidateId;

      if (isCurrentlySelectedAffected) {
        setRawSelectedApplication(null);

        if (event.isBlocked && shouldReceiveNotification) {
          showToast(
            `Currently selected candidate ${event.candidateName} has been blocked and unselected`,
            "error"
          );
        }
      }

      loadApplications()
        .then(() => {
          if (isCurrentlySelectedAffected && !event.isBlocked) {
            setTimeout(() => {
              const updatedApplication = rawApplications.find(
                (app) => app.candidateId === event.candidateId
              );
              if (updatedApplication) {
                rawHandleSelectApplication(updatedApplication);
              }
            }, 100);
          }
        })
        .catch((error) => {
          console.error("❌ Failed to refresh applications:", error);
        });
    },
    [
      user,
      loadApplications,
      rawSelectedApplication,
      setRawSelectedApplication,
      rawHandleSelectApplication,
      rawApplications,
      showToast,
    ]
  );

  // Candidate blocking subscription with memoized callbacks
  // Initialize subscription for real-time updates
  useCandidateBlockingSubscription({
    showToast,
    onCandidateBlocked,
  });

  // Convert to legacy format for existing components
  const applications = rawApplications.map(convertToLegacyApplication);
  const statistics = convertToLegacyStatistics(rawStatistics);
  const selectedApplication = useMemo(
    () =>
      rawSelectedApplication
        ? convertToLegacyApplication(rawSelectedApplication)
        : null,
    [rawSelectedApplication]
  );
  const rankedApplications = rawRankedApplications.map(
    convertToLegacyApplication
  );

  // Additional UI state
  const [courses, setCourses] = useState<Array<{ code: string; name: string }>>(
    []
  );
  const [fullCourseData, setFullCourseData] = useState<
    Array<{
      courseCode: string;
      courseName: string;
      availableTutors?: number;
      availableLabAssistants?: number;
      maxTutors?: number;
      maxLabAssistants?: number;
    }>
  >([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [skillsFilterArray, setSkillsFilterArray] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Authentication check
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      redirect("/signin");
      return;
    }

    if (user.userType !== "lecturer") {
      redirect(user.userType === "candidate" ? "/tutor" : "/");
      return;
    }
  }, [user, isAuthenticated, authLoading]);

  // Load available courses and extract skills
  const loadCourses = useCallback(async () => {
    try {
      const response = await ApplicationService.getAssignedCoursesForLecturer();
      if (response.success && response.data && response.data.length > 0) {
        const courseList = response.data.map((course) => ({
          code: course.courseCode,
          name: course.courseName,
        }));
        setCourses(courseList);

        // Store full course data with position information
        const fullCourses = response.data.map((course) => ({
          courseCode: course.courseCode,
          courseName: course.courseName,
          availableTutors: course.availableTutors,
          availableLabAssistants: course.availableLabAssistants,
          maxTutors: course.maxTutors,
          maxLabAssistants: course.maxLabAssistants,
        }));
        setFullCourseData(fullCourses);
      } else {
        setCourses([]);
        setFullCourseData([]);
        if (response.message && !response.success) {
          showToast(
            "No courses assigned yet. Contact administrator for course assignments.",
            "info"
          );
        }
      }
    } catch (error) {
      console.error("Error loading assigned courses:", error);
      setCourses([]);
      setFullCourseData([]);
      showToast(
        "Error loading courses. Please check your connection.",
        "error"
      );
    }
  }, [showToast]);

  useEffect(() => {
    if (isInitialized) {
      loadCourses();
    }
  }, [isInitialized, loadCourses]);

  // Add a periodic refresh to detect course changes
  useEffect(() => {
    if (!isInitialized) return;

    const refreshInterval = setInterval(() => {
      loadCourses();
      loadApplications();
    }, 60000);

    return () => clearInterval(refreshInterval);
  }, [isInitialized, loadCourses, loadApplications]);



  // Extract all unique skills from applications
  useEffect(() => {
    const allSkills = new Set<string>();
    rawApplications.forEach((app) => {
      if (app.skills) {
        app.skills.split(",").forEach((skill) => {
          const trimmedSkill = skill.trim();
          if (trimmedSkill) {
            allSkills.add(trimmedSkill);
          }
        });
      }
    });
    setAvailableSkills(Array.from(allSkills).sort());
  }, [rawApplications]);

  // Sync skillsFilterArray with the string skillsFilter from the hook
  useEffect(() => {
    if (skillsFilter) {
      setSkillsFilterArray(
        skillsFilter
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s)
      );
    } else {
      setSkillsFilterArray([]);
    }
  }, [skillsFilter]);

  // Handle skills filter change - convert array to comma-separated string
  const handleSkillsFilterChange = (skills: string[]) => {
    setSkillsFilterArray(skills);
    setSkillsFilter(skills.join(", "));
  };

  // Calculate active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedCourse && selectedCourse !== "all") count++;
    if (roleTypeFilter && roleTypeFilter !== "all") count++;
    if (availabilityFilter && availabilityFilter !== "all") count++;
    if (statusFilter && statusFilter !== "all") count++;
    if (skillsFilterArray.length > 0) count += skillsFilterArray.length;
    return count;
  };

  // Clear all filters function
  const handleClearAllFilters = () => {
    setSearchQuery("");
    setSelectedCourse("all");
    setRoleTypeFilter("all");
    setAvailabilityFilter("all");
    setStatusFilter("all");
    setSkillsFilter("");
    setSkillsFilterArray([]);
    setSortBy("none");
  };

  // Wrap the selection handler to convert back to ApplicationResponse
  const handleSelectApplication = (app: Application) => {
    const originalApp = rawApplications.find(
      (rawApp) => rawApp.id.toString() === app.id
    );

    if (originalApp) {
      rawHandleSelectApplication(originalApp);
    } else {
      console.error("❌ Could not find original app in rawApplications");
    }
  };

  // Application actions (simplified - using new backend)
  const handleSaveComment = async () => {
    if (!rawSelectedApplication) return;

    try {
      const response = await ApplicationService.updateApplicationComment(
        rawSelectedApplication.id,
        comment
      );

      if (response.success) {
        showToast("Comment saved successfully", "success");
        await Promise.all([loadApplications(), loadCourses()]);
      } else {
        showToast(response.message || "Failed to save comment", "error");
      }
    } catch (error) {
      console.error("💾 Error saving comment:", error);
      showToast("Error saving comment", "error");
    }
  };

  const handleDeleteComment = async () => {
    if (!rawSelectedApplication) return;

    try {
      const response = await ApplicationService.deleteApplicationComment(
        rawSelectedApplication.id
      );

      if (response.success) {
        setComment("");
        showToast("Comment deleted", "success");
        await Promise.all([loadApplications(), loadCourses()]);
      } else {
        showToast(response.message || "Failed to delete comment", "error");
      }
    } catch {
      showToast("Error deleting comment", "error");
    }
  };

  const handleSelectApplicantButton = async (selectedCourses: string[]) => {
    let targetApplication: ApplicationResponse | null = rawSelectedApplication;

    if (!targetApplication && selectedApplication) {
      targetApplication =
        rawApplications.find(
          (rawApp) => rawApp.id.toString() === selectedApplication.id
        ) || null;

      if (targetApplication) {
        rawHandleSelectApplication(targetApplication);
      }
    }

    if (!targetApplication) {
      showToast(
        "No application found. Please try selecting the applicant from the list first.",
        "error"
      );
      return;
    }

    try {
      const response = await ApplicationService.updateApplicationStatus(
        targetApplication.id,
        "selected",
        comment,
        selectedCourses
      );

      if (response.success) {
        showToast("Applicant selected successfully", "success");
        await Promise.all([loadApplications(), loadCourses()]);
      } else {
        showToast(response.message || "Failed to select applicant", "error");
      }
    } catch (error) {
      console.error("❌ Error in handleSelectApplicantButton:", error);
      showToast("Error selecting applicant", "error");
    }
  };

  const handleMoveStatus = async (
    app: ApplicationResponse,
    status: "pending" | "shortlisted" | "selected" | "rejected"
  ) => {
    try {
      const response = await ApplicationService.updateApplicationStatus(
        app.id,
        status
      );
      if (response.success) {
        showToast(`Moved to ${status}`, "success");
        await loadApplications();
        if (rawSelectedApplication?.id === app.id && response.data) {
          rawHandleSelectApplication(response.data);
        }
      } else {
        showToast(response.message || "Failed to update status", "error");
      }
    } catch {
      showToast("Error updating status", "error");
    }
  };

  const handleToggleCompare = (app: ApplicationResponse) => {
    setCompareIds((prev) => {
      if (prev.includes(app.id)) {
        return prev.filter((id) => id !== app.id);
      }
      if (prev.length >= 3) {
        showToast("Compare up to 3 applicants at a time", "info");
        return prev;
      }
      return [...prev, app.id];
    });
  };

  const handleUnselectApplicant = async () => {
    if (!rawSelectedApplication) return;

    try {
      if (selectedApplication?.rank && selectedApplication.rank > 0) {
        const removeRankingResponse =
          await ApplicationService.removeApplicationFromRanking(
            parseInt(selectedApplication.id)
          );

        if (!removeRankingResponse.success) {
          console.warn(
            "Failed to remove from ranking:",
            removeRankingResponse.message
          );
        }
      }

      const response = await ApplicationService.updateApplicationStatus(
        rawSelectedApplication.id,
        "pending"
      );

      if (response.success) {
        showToast("Applicant unselected and removed from ranking", "success");
        await Promise.all([loadApplications(), loadCourses()]);
      } else {
        showToast(response.message || "Failed to unselect applicant", "error");
      }
    } catch {
      showToast("Error unselecting applicant", "error");
    }
  };

  // Enhanced ranking functions with backend integration
  const handleAddToRanking = async () => {
    if (!selectedApplication) return;

    if (!selectedApplication.selected) {
      showToast(
        "Please select the applicant before adding to ranking",
        "error"
      );
      return;
    }

    if (
      selectedApplication.rank !== undefined &&
      selectedApplication.rank !== null &&
      selectedApplication.rank > 0
    ) {
      showToast("Applicant is already added to ranking", "info");
      return;
    }

    if (!selectedApplication.comment || !comment.trim()) {
      showToast(
        "Please add and save a comment before adding to ranking",
        "error"
      );
      return;
    }

    const hasUnsavedComment = comment !== (selectedApplication.comment || "");
    if (hasUnsavedComment) {
      showToast("Please save your comment before adding to ranking", "error");
      return;
    }

    let courseForRanking = selectedRankingCourse;
    if (!courseForRanking && selectedApplication.courses.length > 0) {
      courseForRanking = selectedApplication.courses[0];
    }

    if (!courseForRanking) {
      showToast("No course found for ranking", "error");
      return;
    }

    try {
      const currentRankedForCourse = rankedApplications.filter(
        (app) =>
          app.selectedForCourses?.includes(courseForRanking) ||
          app.courses.includes(courseForRanking)
      );
      const nextRank = currentRankedForCourse.length + 1;

      const response = await ApplicationService.addApplicationToRanking(
        parseInt(selectedApplication.id),
        nextRank,
        courseForRanking
      );

      if (response.success) {
        showToast("Added to ranking successfully", "success");
        await Promise.all([loadApplications(), loadCourses()]);
      } else {
        showToast(response.message || "Failed to add to ranking", "error");
      }
    } catch {
      showToast("Error adding to ranking", "error");
    }
  };

  const handleMoveUp = async (app: Application) => {
    if (!selectedRankingCourse) return;

    const filteredRanked = rankedApplications.filter(
      (ranked) =>
        ranked.selectedForCourses?.includes(selectedRankingCourse) ||
        ranked.courses.includes(selectedRankingCourse)
    );

    const currentIndex = filteredRanked.findIndex(
      (ranked) => ranked.id === app.id
    );
    if (currentIndex <= 0) return;

    const currentRank = currentIndex + 1;
    const newRank = currentRank - 1;

    try {
      const response = await ApplicationService.updateApplicationRanking(
        parseInt(app.id),
        newRank,
        selectedRankingCourse
      );

      if (response.success) {
        const appAbove = filteredRanked[currentIndex - 1];
        await ApplicationService.updateApplicationRanking(
          parseInt(appAbove.id),
          currentRank,
          selectedRankingCourse
        );

        showToast("Ranking updated successfully", "success");
        await Promise.all([loadApplications(), loadCourses()]);
      } else {
        showToast(response.message || "Failed to update ranking", "error");
      }
    } catch {
      showToast("Error updating ranking", "error");
    }
  };

  const handleMoveDown = async (app: Application) => {
    if (!selectedRankingCourse) return;

    const filteredRanked = rankedApplications.filter(
      (ranked) =>
        ranked.selectedForCourses?.includes(selectedRankingCourse) ||
        ranked.courses.includes(selectedRankingCourse)
    );

    const currentIndex = filteredRanked.findIndex(
      (ranked) => ranked.id === app.id
    );
    if (currentIndex >= filteredRanked.length - 1 || currentIndex < 0) return;

    const currentRank = currentIndex + 1;
    const newRank = currentRank + 1;

    try {
      const response = await ApplicationService.updateApplicationRanking(
        parseInt(app.id),
        newRank,
        selectedRankingCourse
      );

      if (response.success) {
        const appBelow = filteredRanked[currentIndex + 1];
        await ApplicationService.updateApplicationRanking(
          parseInt(appBelow.id),
          currentRank,
          selectedRankingCourse
        );

        showToast("Ranking updated successfully", "success");
        await Promise.all([loadApplications(), loadCourses()]);
      } else {
        showToast(response.message || "Failed to update ranking", "error");
      }
    } catch {
      showToast("Error updating ranking", "error");
    }
  };

  const handleRemoveFromRanking = async (id: string) => {
    try {
      const response = await ApplicationService.removeApplicationFromRanking(
        parseInt(id)
      );

      if (response.success) {
        showToast("Removed from ranking successfully", "success");
        await Promise.all([loadApplications(), loadCourses()]);
      } else {
        showToast(response.message || "Failed to remove from ranking", "error");
      }
    } catch (error) {
      console.error("❌ Remove ranking error:", error);
      showToast("Error removing from ranking", "error");
    }
  };

  useEffect(() => {
    if (
      activeTab === "rankings" &&
      !selectedRankingCourse &&
      courses.length > 0
    ) {
      setSelectedRankingCourse(courses[0].code);
    }
  }, [activeTab, selectedRankingCourse, setSelectedRankingCourse, courses]);

  if (authLoading || !isInitialized) {
    return <PageSkeleton variant="lecturer" />;
  }

  return (
    <div className={styles.lecturerDashboard}>
        <div className="container">
          {/* Dashboard Header */}
          <div className={styles.revealHeader}>
            <DashboardHeader
              lecturerName={lecturerName}
              statistics={statistics}
            />
          </div>

          {/* Enhanced Application Filters */}
          <div className={styles.revealFilters}>
            <ApplicationFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCourse={selectedCourse}
              onCourseChange={setSelectedCourse}
              courses={courses}
              roleTypeFilter={roleTypeFilter}
              onRoleTypeChange={setRoleTypeFilter}
              availabilityFilter={availabilityFilter}
              onAvailabilityChange={setAvailabilityFilter}
              skillsFilter={skillsFilterArray}
              onSkillsFilterChange={handleSkillsFilterChange}
              availableSkills={availableSkills}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onClearFilters={handleClearAllFilters}
              activeFilterCount={getActiveFilterCount()}
            />
          </div>

          {/* Dashboard Tabs */}
          <div className={styles.revealTabs}>
            <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Main Content */}
          <div className={`${styles.dashboardContent} ${styles.revealContent}`}>
            {activeTab === "applications" && (
              <div className={styles.applicationsSection}>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    className={styles.courseSelect}
                    onClick={() => setViewMode("list")}
                    style={{
                      fontWeight: viewMode === "list" ? 700 : 400,
                    }}
                  >
                    List
                  </button>
                  <button
                    type="button"
                    className={styles.courseSelect}
                    onClick={() => setViewMode("kanban")}
                    style={{
                      fontWeight: viewMode === "kanban" ? 700 : 400,
                    }}
                  >
                    Kanban
                  </button>
                  {compareIds.length > 0 && (
                    <button
                      type="button"
                      className={styles.courseSelect}
                      onClick={() => setShowCompare(true)}
                    >
                      Compare ({compareIds.length})
                    </button>
                  )}
                </div>

                {viewMode === "kanban" && (
                  <KanbanBoard
                    applications={rawApplications}
                    selectedId={rawSelectedApplication?.id ?? null}
                    compareIds={compareIds}
                    onSelect={rawHandleSelectApplication}
                    onToggleCompare={handleToggleCompare}
                    onMoveStatus={handleMoveStatus}
                  />
                )}

                <div className={styles.applicationsGrid}>
                  {viewMode === "list" && (
                    <div className={styles.applicantListSection}>
                      <ApplicantList
                        applications={applications}
                        selectedApplication={selectedApplication}
                        onSelectApplication={handleSelectApplication}
                      />
                    </div>
                  )}

                  <div className={styles.applicantDetailsSection}>
                    <ApplicantDetails
                      application={selectedApplication}
                      comment={comment}
                      setComment={setComment}
                      onSaveComment={handleSaveComment}
                      onDeleteComment={handleDeleteComment}
                      onSelectApplicant={handleSelectApplicantButton}
                      onUnselectApplicant={handleUnselectApplicant}
                      onAddToRanking={handleAddToRanking}
                      showToast={showToast}
                      courses={fullCourseData}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "rankings" && (
              <div className={styles.rankingsSection}>
                {/* Course Selection for Rankings Tab */}
                <div className={styles.courseSelector}>
                  <label htmlFor="rankingsCourseSelect">
                    View Rankings for:
                  </label>
                  {courses.length > 0 ? (
                    <select
                      id="rankingsCourseSelect"
                      value={selectedRankingCourse}
                      onChange={(e) => setSelectedRankingCourse(e.target.value)}
                      className={styles.courseSelect}
                    >
                      <option value="">Select an Assigned Course</option>
                      {courses.map((course) => (
                        <option key={course.code} value={course.code}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className={styles.noCourseMessage}>
                      <span className={styles.warningIcon}>⚠️</span>
                      No courses assigned. Contact administrator.
                    </div>
                  )}
                </div>

                <RankedCandidates
                  rankedApplications={rankedApplications}
                  selectedCourse={selectedRankingCourse}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onRemove={handleRemoveFromRanking}
                  showCourseFilter={true}
                  onCourseChange={setSelectedRankingCourse}
                  availableCourses={courses}
                />
              </div>
            )}

            {activeTab === "stats" && (
              <div className={styles.statsSection}>
                <ApplicantStatsVisualization applications={applications} />
              </div>
            )}
          </div>
        </div>

        {/* Toast Notifications */}
        {showCompare && (
          <ComparePanel
            applications={rawApplications.filter((a) =>
              compareIds.includes(a.id)
            )}
            onClose={() => setShowCompare(false)}
          />
        )}

        {toastMessage && (
          <Toast
            message={toastMessage}
            type={toastType}
            visible={!!toastMessage}
            onClose={() => setToastMessage(null)}
            variant="toast"
            position="bottom-left"
            autoClose={true}
            autoCloseDelay={3000}
          />
        )}
      </div>
  );
};

const LecturerDashboardClient: React.FC = () => {
  return (
    <AdminApolloProvider>
      <LecturerDashboardInner />
    </AdminApolloProvider>
  );
};

export default LecturerDashboardClient;
