import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { dedupeInFlight } from "@/shared/utils/inFlightRequest";
import {
  ApplicationService,
  ApplicationResponse,
  ApplicationFilters,
  ApplicationStatistics,
} from "@/shared/services/applicationService";

export const useApplicationManagement = () => {
  // Data state
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [statistics, setStatistics] = useState<ApplicationStatistics | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Filter state for CR Part
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedRankingCourse, setSelectedRankingCourse] =
    useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 320);
  const [roleTypeFilter, setRoleTypeFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [skillsFilter, setSkillsFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("none");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Selected application state
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationResponse | null>(null);
  const [comment, setComment] = useState<string>("");

  // Ranking state (for existing functionality)
  const [rankedApplications, setRankedApplications] = useState<
    ApplicationResponse[]
  >([]);
  const skipFilterReloadRef = useRef(true);
  const reloadDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateRankedFromApplications = useCallback((data: ApplicationResponse[]) => {
    const ranked = data.filter(
      (app) =>
        !app.isWithdrawn &&
        !app.candidate?.isBlocked &&
        app.rank !== undefined &&
        app.rank !== null &&
        app.rank > 0 &&
        app.rankedForCourse
    );

    ranked.sort((a, b) => (a.rank || 0) - (b.rank || 0));
    setRankedApplications(ranked);
  }, []);

  const applyApplicationsResponse = useCallback(
    (data: ApplicationResponse[]) => {
      setApplications(data);
      updateRankedFromApplications(data);
    },
    [updateRankedFromApplications]
  );

  // Load applications with filters (CR Part)
  const loadApplications = useCallback(async () => {
    try {
      setIsLoading(true);

      // Build filters object
      const filters: ApplicationFilters = {};

      if (debouncedSearchQuery.trim()) {
        filters.candidateName = debouncedSearchQuery.trim();
      }
      if (roleTypeFilter !== "all") filters.roleType = roleTypeFilter;
      if (availabilityFilter !== "all")
        filters.availability = availabilityFilter;
      if (skillsFilter.trim()) filters.skills = skillsFilter.trim();
      if (selectedCourse !== "all") filters.courseCode = selectedCourse;
      if (statusFilter !== "all") filters.status = statusFilter;

      filters.page = page;
      filters.pageSize = pageSize;

      if (sortBy === "name") {
        filters.sortBy = "candidateName";
        filters.sortDir = "asc";
      } else if (sortBy === "date") {
        filters.sortBy = "appliedAt";
        filters.sortDir = "desc";
      } else if (sortBy === "status") {
        filters.sortBy = "status";
        filters.sortDir = "asc";
      }

      const filterKey = JSON.stringify({ ...filters, page, sortBy });
      const response = await dedupeInFlight(
        `lecturer-applications:${filterKey}`,
        () => ApplicationService.getApplicationsForLecturer(filters)
      );

      if (response.success && response.data) {
        applyApplicationsResponse(response.data.items ?? []);
        setTotalCount(response.data.totalCount ?? 0);
        setTotalPages(response.data.totalPages ?? 1);
      } else {
        setApplications([]);
        setRankedApplications([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch {
      setApplications([]);
      setRankedApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedSearchQuery,
    roleTypeFilter,
    availabilityFilter,
    skillsFilter,
    selectedCourse,
    statusFilter,
    page,
    sortBy,
    applyApplicationsResponse,
  ]);

  const scheduleLoadApplications = useCallback(() => {
    if (reloadDebounceRef.current) {
      clearTimeout(reloadDebounceRef.current);
    }

    reloadDebounceRef.current = setTimeout(() => {
      reloadDebounceRef.current = null;
      void loadApplications();
    }, 800);
  }, [loadApplications]);

  const patchApplication = useCallback(
    (updated: ApplicationResponse) => {
      setApplications((prev) => {
        const next = prev.map((app) =>
          app.id === updated.id ? { ...app, ...updated } : app
        );
        updateRankedFromApplications(next);
        return next;
      });

      setSelectedApplication((prev) =>
        prev?.id === updated.id ? { ...prev, ...updated } : prev
      );
    },
    [updateRankedFromApplications]
  );

  // Load statistics (DI Part)
  const loadStatistics = useCallback(async () => {
    try {
      const response = await ApplicationService.getApplicationStatistics();

      if (response.success && response.data) {
        setStatistics(response.data);
      } else {
        setStatistics(null);
      }
    } catch {
      setStatistics(null);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([loadApplications(), loadStatistics()]);
        setIsInitialized(true);
      } catch {
        setIsInitialized(true); // Still mark as initialized to show UI
      }
    };

    initializeData();
  }, [loadApplications, loadStatistics]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearchQuery,
    roleTypeFilter,
    availabilityFilter,
    skillsFilter,
    selectedCourse,
    statusFilter,
    sortBy,
  ]);

  // Reload when filters change (skip the run right after initial load)
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (skipFilterReloadRef.current) {
      skipFilterReloadRef.current = false;
      return;
    }

    void loadApplications();
  }, [
    isInitialized,
    loadApplications,
    debouncedSearchQuery,
    roleTypeFilter,
    availabilityFilter,
    skillsFilter,
    selectedCourse,
    statusFilter,
    page,
    sortBy,
  ]);

  // Sync selectedApplication with updated applications data
  useEffect(() => {
    if (selectedApplication && applications.length > 0) {
      // Find the updated version of the currently selected application
      const updatedSelectedApplication = applications.find(
        (app) => app.id === selectedApplication.id
      );
      if (updatedSelectedApplication) {
        const hasCommentChanged =
          selectedApplication.comment !== updatedSelectedApplication.comment;
        const hasRankChanged =
          selectedApplication.rank !== updatedSelectedApplication.rank;
        const hasBlockedStatusChanged =
          selectedApplication.candidate?.isBlocked !==
          updatedSelectedApplication.candidate?.isBlocked;
        const hasStatusChanged =
          selectedApplication.status !== updatedSelectedApplication.status;
        const hasReviewChanged =
          selectedApplication.reviewedAt !== updatedSelectedApplication.reviewedAt;

        const mergedSelectedApplication =
          selectedApplication.reviewedAt &&
          !updatedSelectedApplication.reviewedAt
            ? {
                ...updatedSelectedApplication,
                reviewedAt: selectedApplication.reviewedAt,
                reviewedBy: selectedApplication.reviewedBy,
              }
            : updatedSelectedApplication;

        if (
          mergedSelectedApplication !== selectedApplication ||
          hasCommentChanged ||
          hasRankChanged ||
          hasBlockedStatusChanged ||
          hasStatusChanged ||
          hasReviewChanged
        ) {
          setSelectedApplication(mergedSelectedApplication);
          setComment(mergedSelectedApplication.comment || "");
        }
      }
    }
  }, [applications, selectedApplication]); // Include full selectedApplication as dependency

  // Save application (update status)
  const saveApplication = useCallback(
    async (application: ApplicationResponse) => {
      try {
        const response = await ApplicationService.updateApplicationStatus(
          application.id,
          application.status,
          undefined,
          application.status === "selected"
            ? [application.course.courseCode]
            : undefined
        );

        if (response.success) {
          // Reload applications to get updated data
          await loadApplications();
          return { success: true };
        } else {
          return { success: false, message: response.message };
        }
      } catch (error: unknown) {
        const errorMessage =
          error && typeof error === "object" && "response" in error
            ? (error as { response?: { data?: { message?: string } } }).response
                ?.data?.message
            : "Failed to save application";
        return {
          success: false,
          message: errorMessage || "Failed to save application",
        };
      }
    },
    [loadApplications]
  );

  // Handle application selection
  const handleSelectApplication = useCallback(
    (application: ApplicationResponse) => {
      setSelectedApplication(application);
      setComment(application.comment || ""); // Load existing comment when selecting application
    },
    []
  );

  // Sort applications based on sortBy criteria
  const sortedApplications = useMemo(() => {
    if (!applications.length) return [];

    const sorted = [...applications];

    switch (sortBy) {
      case "name":
        return sorted.sort((a, b) => {
          const nameA =
            `${a.candidate?.firstName || ""} ${a.candidate?.lastName || ""}`.toLowerCase();
          const nameB =
            `${b.candidate?.firstName || ""} ${b.candidate?.lastName || ""}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });

      case "availability":
        return sorted.sort((a, b) => {
          const availabilityA =
            (a.availability as { type: string })?.type || "";
          const availabilityB =
            (b.availability as { type: string })?.type || "";
          return availabilityA.localeCompare(availabilityB);
        });

      case "date":
        return sorted.sort((a, b) => {
          return (
            new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
          );
        });

      case "status":
        return sorted.sort((a, b) => a.status.localeCompare(b.status));

      default:
        return sorted;
    }
  }, [applications, sortBy]);

  return {
    // Data
    applications: sortedApplications,
    statistics,
    isLoading,
    isInitialized,

    // Selection state
    selectedApplication,
    setSelectedApplication,
    comment,
    setComment,
    rankedApplications,
    setRankedApplications,

    // Filter state (CR Part)
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

    page,
    setPage,
    pageSize,
    totalCount,
    totalPages,

    // Actions
    loadApplications,
    scheduleLoadApplications,
    patchApplication,
    loadStatistics,
    saveApplication,
    handleSelectApplication,

    // Computed
    sortedApplications,
  };
};
