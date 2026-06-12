"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  ApplicationService,
  ApplicationResponse,
} from "@/shared/services/applicationService";
import { Application } from "@/shared/types/application";
import ApplicantList from "@/modules/lecturer/components/applicant-list/applicant-list";
import LecturerApplicantDetailPanel from "@/modules/lecturer/components/applicant-detail/LecturerApplicantDetailPanel";
import RankedCandidates from "@/modules/lecturer/components/ranked-candidates/ranked-candidates";
import Toast from "@/shared/components/common/toast/toast";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";
import { useLecturerAuth } from "@/modules/lecturer/hooks/useLecturerAuth";
import { useApplicationManagement } from "@/modules/lecturer/hooks/useApplicationManagement";
import DashboardHeader from "@/modules/lecturer/components/dashboard-header/DashboardHeader";
import DashboardTabs from "@/modules/lecturer/components/dashboard-tabs/DashboardTabs";
import ApplicationFilters from "@/modules/lecturer/components/application-filters/ApplicationFilters";
import AppSelect from "@/shared/components/common/app-select/AppSelect";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useRouter } from "next/navigation";
import styles from "./LecturerPage.module.css";
import { useCandidateBlockingSubscription } from "@/hooks/useCandidateBlockingSubscription";
import { useApplicationRealtime } from "@/shared/hooks/useApplicationRealtime";
import type { ApplicationUpdatedPayload } from "@/shared/socket/applicationEvents";
import { formatCandidateDisplayName } from "@/shared/utils/personDisplayName";
import { useConfirmModal } from "@/shared/hooks/useConfirmModal";

const ApplicantStatsVisualization = dynamic(
  () =>
    import(
      "@/modules/lecturer/components/applicant-stats-visualization/applicant-stats-visualization"
    ),
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

const matchesRankingCourse = (
  app: { rankedForCourse?: string; courses: string[] },
  courseCode: string
) =>
  Boolean(
    app.rankedForCourse &&
      app.rankedForCourse === courseCode &&
      app.courses.includes(courseCode)
  );

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
    fullName: formatCandidateDisplayName(
      {
        firstName: appResponse.candidate?.firstName,
        lastName: appResponse.candidate?.lastName,
        email: appResponse.candidate?.email,
        userType: "candidate",
      },
      "Applicant"
    ),
    courses: [appResponse.course.courseCode],
    availability,
    skills: appResponse.skills
      ? appResponse.skills.split(",").map((s) => s.trim())
      : [],
    academicCredentials: appResponse.experience || "",
    dateApplied: appResponse.appliedAt,
    status: appResponse.status as "pending" | "selected" | "rejected",
    selected: appResponse.status === "selected",
    isShortlisted: appResponse.isShortlisted ?? false,
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
    selectedForCourses: appResponse.rankedForCourse
      ? [appResponse.rankedForCourse]
      : appResponse.status === "selected"
        ? [appResponse.course.courseCode]
        : undefined,
    rankedForCourse: appResponse.rankedForCourse,
    isBlocked: appResponse.candidate?.isBlocked || false,
    isWithdrawn: appResponse.isWithdrawn || false,
    avatarUrl: appResponse.candidate?.avatarUrl ?? null,
    firstName: appResponse.candidate?.firstName,
    lastName: appResponse.candidate?.lastName,
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
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { lecturerName } = useLecturerAuth();

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>("applications");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "success"
  );

  const { ask, modal: confirmModal } = useConfirmModal();

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
    scheduleLoadApplications,
    patchApplication,
    handleSelectApplication: rawHandleSelectApplication,
  } = useApplicationManagement();

  const handleApplicationDetailUpdated = useCallback(
    (app: ApplicationResponse) => {
      setRawSelectedApplication(app);
      setComment(app.comment || "");
      patchApplication(app);
    },
    [setRawSelectedApplication, setComment, patchApplication]
  );

  const handleApplicationRealtimeUpdate = useCallback(
    (payload: ApplicationUpdatedPayload) => {
      patchApplication(payload.application);

      if (
        rawSelectedApplication &&
        payload.application.id === rawSelectedApplication.id
      ) {
        setRawSelectedApplication(payload.application);
        setComment(payload.application.comment || "");
      }

      const chatReasons = new Set([
        "comment",
        "comment_removed",
        "candidate_response",
        "reaction",
        "reviewed",
      ]);

      if (!chatReasons.has(payload.reason)) {
        scheduleLoadApplications();
      }
    },
    [
      scheduleLoadApplications,
      patchApplication,
      rawSelectedApplication,
      setRawSelectedApplication,
      setComment,
    ]
  );

  useApplicationRealtime({
    enabled:
      !authLoading &&
      isAuthenticated &&
      user?.userType === "lecturer" &&
      isInitialized,
    onApplicationUpdated: handleApplicationRealtimeUpdate,
  });

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
        .catch(() => {
          // Refresh failed silently; list will update on next load.
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
      selectedTutors?: number;
      selectedLabAssistants?: number;
      maxTutors?: number;
      maxLabAssistants?: number;
    }>
  >([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [skillsFilterArray, setSkillsFilterArray] = useState<string[]>([]);

  // Authentication check
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      router.replace("/signin");
      return;
    }

    if (user.userType !== "lecturer") {
      router.replace(user.userType === "candidate" ? "/tutor" : "/");
    }
  }, [user, isAuthenticated, authLoading, router]);

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
          selectedTutors: course.selectedTutors,
          selectedLabAssistants: course.selectedLabAssistants,
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
    } catch {
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
    }
  };

  const handleRemoveBlockedApplication = useCallback(
    async (app?: Application) => {
      const targetId =
        app?.id ??
        rawSelectedApplication?.id.toString() ??
        selectedApplication?.id;

      if (!targetId) {
        showToast("No application selected", "error");
        return;
      }

      const numericId = parseInt(String(targetId), 10);
      if (Number.isNaN(numericId)) {
        showToast("Invalid application", "error");
        return;
      }

      if (
        !app?.isBlocked &&
        !rawSelectedApplication?.candidate?.isBlocked &&
        !selectedApplication?.isBlocked
      ) {
        showToast("Only blocked applications can be removed", "error");
        return;
      }

      if (
        !(await ask({
          title: "Remove application?",
          message: "Blocked account.",
          confirmLabel: "Yes",
          cancelLabel: "No",
          variant: "danger",
          actionsLayout: "split",
        }))
      ) {
        return;
      }

      try {
        const response =
          await ApplicationService.deleteBlockedApplication(numericId);

        if (response.success) {
          showToast("Application removed", "success");
          if (
            rawSelectedApplication?.id === numericId ||
            selectedApplication?.id === String(numericId)
          ) {
            setRawSelectedApplication(null);
          }
          await loadApplications();
        } else {
          showToast(response.message || "Failed to remove application", "error");
        }
      } catch {
        showToast("Error removing application", "error");
      }
    },
    [
      loadApplications,
      rawSelectedApplication,
      selectedApplication,
      setRawSelectedApplication,
      showToast,
      ask,
    ]
  );

  const resolveTargetApplication = (): ApplicationResponse | null => {
    if (rawSelectedApplication) return rawSelectedApplication;

    if (!selectedApplication) return null;

    return (
      rawApplications.find(
        (rawApp) => rawApp.id.toString() === selectedApplication.id
      ) ?? null
    );
  };

  const handleShortlistApplicant = async () => {
    const targetApplication = resolveTargetApplication();
    if (!targetApplication) {
      showToast("No application found. Select an applicant from the list first.", "error");
      return;
    }

    try {
      const response = await ApplicationService.shortlistApplication(
        targetApplication.id
      );
      if (response.success) {
        showToast(
          response.message || "Applicant shortlisted and added to ranking",
          "success"
        );
        await loadApplications();
      } else {
        showToast(response.message || "Failed to shortlist applicant", "error");
      }
    } catch {
      showToast("Error shortlisting applicant", "error");
    }
  };

  const handleDeclineApplicant = async () => {
    const targetApplication = resolveTargetApplication();
    if (!targetApplication) return;

    const confirmed = await ask({
      title: "Decline applicant?",
      confirmLabel: "Yes",
      cancelLabel: "No",
      variant: "danger",
      actionsLayout: "split",
    });
    if (!confirmed) return;

    try {
      const response = await ApplicationService.updateApplicationStatus(
        targetApplication.id,
        "rejected"
      );
      if (response.success) {
        showToast("Application declined", "success");
        await Promise.all([loadApplications(), loadCourses()]);
      } else {
        showToast(response.message || "Failed to decline application", "error");
      }
    } catch {
      showToast("Error declining application", "error");
    }
  };

  const handleRemoveShortlist = async () => {
    const targetApplication = resolveTargetApplication();
    if (!targetApplication) return;

    try {
      const response = await ApplicationService.removeShortlist(
        targetApplication.id
      );
      if (response.success) {
        showToast("Removed from shortlist", "success");
        await loadApplications();
      } else {
        showToast(response.message || "Failed to remove shortlist", "error");
      }
    } catch {
      showToast("Error removing shortlist", "error");
    }
  };

  const handleConfirmSelection = async () => {
    const targetApplication = resolveTargetApplication();
    if (!targetApplication) {
      showToast("No application found. Select an applicant from the list first.", "error");
      return;
    }

    try {
      const response = await ApplicationService.updateApplicationStatus(
        targetApplication.id,
        "selected",
        comment,
        [targetApplication.course.courseCode]
      );

      if (response.success) {
        showToast("Final selection confirmed", "success");
        await Promise.all([loadApplications(), loadCourses()]);
      } else {
        showToast(response.message || "Failed to confirm selection", "error");
      }
    } catch {
      showToast("Error confirming selection", "error");
    }
  };

  const handleRevokeSelection = async () => {
    if (!rawSelectedApplication) return;

    try {
      const response = await ApplicationService.updateApplicationStatus(
        rawSelectedApplication.id,
        "pending"
      );

      if (response.success) {
        showToast("Final selection revoked — applicant remains ranked", "success");
        await Promise.all([loadApplications(), loadCourses()]);
      } else {
        showToast(response.message || "Failed to revoke selection", "error");
      }
    } catch {
      showToast("Error revoking selection", "error");
    }
  };

  const handleRemoveFromRankingDetail = async () => {
    if (!rawSelectedApplication) return;

    try {
      const response = await ApplicationService.removeApplicationFromRanking(
        rawSelectedApplication.id
      );

      if (response.success) {
        showToast("Removed from ranking", "success");
        await loadApplications();
      } else {
        showToast(response.message || "Failed to remove from ranking", "error");
      }
    } catch {
      showToast("Error removing from ranking", "error");
    }
  };

  // Enhanced ranking functions with backend integration
  const handleAddToRanking = async () => {
    if (!selectedApplication) return;

    if (!selectedApplication.isShortlisted && !selectedApplication.selected) {
      showToast(
        "Shortlist this applicant before adding to ranking",
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

    const courseForRanking = selectedApplication.courses[0];

    if (!courseForRanking) {
      showToast("No course found for ranking", "error");
      return;
    }

    try {
      const currentRankedForCourse = rankedApplications.filter((app) =>
        matchesRankingCourse(app, courseForRanking)
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

    const filteredRanked = rankedApplications.filter((ranked) =>
      matchesRankingCourse(ranked, selectedRankingCourse)
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

    const filteredRanked = rankedApplications.filter((ranked) =>
      matchesRankingCourse(ranked, selectedRankingCourse)
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
    } catch {
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

  const rankingCourseOptions = [
    { value: "", label: "Select an Assigned Course", isDefault: true },
    ...courses.map((course) => ({
      value: course.code,
      label: `${course.code} - ${course.name}`,
    })),
  ];

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
                <div className={styles.applicationsGrid}>
                  <div className={styles.applicantListSection}>
                    <ApplicantList
                      applications={applications}
                      selectedApplication={selectedApplication}
                      onSelectApplication={handleSelectApplication}
                      onRemoveBlockedApplication={handleRemoveBlockedApplication}
                    />
                  </div>

                  <div className={styles.applicantDetailsSection}>
                    <LecturerApplicantDetailPanel
                      application={rawSelectedApplication}
                      onApplicationUpdated={handleApplicationDetailUpdated}
                      onApplicationChatUpdated={handleApplicationDetailUpdated}
                      onShortlistApplicant={handleShortlistApplicant}
                      onDeclineApplicant={handleDeclineApplicant}
                      onRemoveShortlist={handleRemoveShortlist}
                      onConfirmSelection={handleConfirmSelection}
                      onRevokeSelection={handleRevokeSelection}
                      onAddToRanking={handleAddToRanking}
                      onRemoveFromRanking={handleRemoveFromRankingDetail}
                      onRemoveBlockedApplication={() =>
                        handleRemoveBlockedApplication()
                      }
                      showToast={showToast}
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
                    <AppSelect
                      id="rankingsCourseSelect"
                      value={selectedRankingCourse}
                      onChange={setSelectedRankingCourse}
                      options={rankingCourseOptions}
                      aria-label="Select course for rankings"
                    />
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
                  courseSlotInfo={
                    fullCourseData.find(
                      (course) => course.courseCode === selectedRankingCourse
                    ) ?? null
                  }
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
            darkMode={user?.theme === "dark"}
          />
        )}

        {confirmModal}
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
