import { useState, useEffect, useCallback, useMemo } from "react";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
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

  // Selected application state
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationResponse | null>(null);
  const [comment, setComment] = useState<string>("");

  // Ranking state (for existing functionality)
  const [rankedApplications, setRankedApplications] = useState<
    ApplicationResponse[]
  >([]);

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

      const response =
        await ApplicationService.getApplicationsForLecturer(filters);

      if (response.success && response.data) {
        setApplications(response.data);

        // Update ranked applications - filter for applications with ranking data
        const ranked = response.data.filter(
          (app) =>
            app.status === "selected" &&
            app.rank !== undefined &&
            app.rank !== null &&
            app.rank > 0 &&
            app.rankedForCourse
        );

        ranked.sort((a, b) => (a.rank || 0) - (b.rank || 0));
        setRankedApplications(ranked);
      } else {
        console.error("Failed to load applications:", response.message);
        setApplications([]);
        setRankedApplications([]);
      }
    } catch (error) {
      console.error("Error loading applications:", error);
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
  ]);

  // Load statistics (DI Part)
  const loadStatistics = useCallback(async () => {
    try {
      const response = await ApplicationService.getApplicationStatistics();

      if (response.success && response.data) {
        setStatistics(response.data);
      } else {
        console.error("Failed to load statistics:", response.message);
        setStatistics(null);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
      setStatistics(null);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([loadApplications(), loadStatistics()]);
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing data:", error);
        setIsInitialized(true); // Still mark as initialized to show UI
      }
    };

    initializeData();
  }, [loadApplications, loadStatistics]);

  // Reload when filters change
  useEffect(() => {
    if (isInitialized) {
      loadApplications();
    }
  }, [
    isInitialized,
    loadApplications,
    debouncedSearchQuery,
    roleTypeFilter,
    availabilityFilter,
    skillsFilter,
    selectedCourse,
    statusFilter,
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

        // Sync selectedApplication with updated data

        // Update the selectedApplication if it's different OR if any important field has changed
        if (
          updatedSelectedApplication !== selectedApplication ||
          hasCommentChanged ||
          hasRankChanged ||
          hasBlockedStatusChanged ||
          hasStatusChanged
        ) {
          setSelectedApplication(updatedSelectedApplication);
          // Always update the comment to match the latest comment from the updated application
          setComment(updatedSelectedApplication.comment || "");
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
          application.status
        );

        if (response.success) {
          // Reload applications to get updated data
          await loadApplications();
          return { success: true };
        } else {
          console.error("Failed to save application:", response.message);
          return { success: false, message: response.message };
        }
      } catch (error: unknown) {
        console.error("Error saving application:", error);
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

    // Actions
    loadApplications,
    loadStatistics,
    saveApplication,
    handleSelectApplication,

    // Computed
    sortedApplications,
  };
};
