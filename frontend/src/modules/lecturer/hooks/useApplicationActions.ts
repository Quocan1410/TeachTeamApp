import type { Application as TutorApplication } from "@/shared/types/application";
import { getMelbourneDateOnly } from "@/shared/utils/dateUtils";

interface UseApplicationActionsProps {
  selectedApplication: TutorApplication | null;
  comment: string;
  setComment: (comment: string) => void;
  currentLecturerId: string;
  loadApplications: () => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  saveApplication: (
    application: TutorApplication
  ) => Promise<{ success: boolean; message?: string }>;
  setSelectedApplication: (application: TutorApplication | null) => void;
  rankedApplications: TutorApplication[];
  setRankedApplications: (applications: TutorApplication[]) => void;
}

export const useApplicationActions = ({
  selectedApplication,
  comment,
  setComment,
  currentLecturerId,
  loadApplications,
  showToast,
  saveApplication,
  setSelectedApplication,
  rankedApplications,
  setRankedApplications,
}: UseApplicationActionsProps) => {
  const handleSaveComment = async () => {
    if (selectedApplication) {
      const updatedApplication = {
        ...selectedApplication,
        comment: comment,
      };
      const result = await saveApplication(updatedApplication);
      if (result.success) {
        loadApplications();
        setSelectedApplication(updatedApplication);
        showToast("Comment saved!", "success");
      } else {
        showToast(result.message || "Failed to save comment.", "error");
      }
    }
  };

  const handleDeleteComment = async () => {
    if (selectedApplication) {
      const updatedApplication = {
        ...selectedApplication,
        comment: "",
      };
      const result = await saveApplication(updatedApplication);
      if (result.success) {
        loadApplications();
        setSelectedApplication(updatedApplication);
        setComment("");
        showToast("Comment deleted!", "success");
      } else {
        showToast(result.message || "Failed to delete comment.", "error");
      }
    }
  };

  const handleSelectApplicantButton = async (selectedCourses: string[]) => {
    if (selectedApplication) {
      const updatedApplication = {
        ...selectedApplication,
        selected: true,
        selectedBy: currentLecturerId,
        selectedDate: getMelbourneDateOnly(),
        selectedForCourses: selectedCourses,
      };

      try {
        const result = await saveApplication(updatedApplication);
        if (result.success) {
          loadApplications();
          setSelectedApplication(updatedApplication);
          showToast("Applicant selected!", "success");
        } else {
          // Show the specific error message from the backend
          showToast(result.message || "Failed to select applicant.", "error");
        }
      } catch (error) {
        console.error("Error selecting applicant:", error);
        showToast("Failed to select applicant. Please try again.", "error");
      }
    }
  };

  const handleUnselectApplicant = async () => {
    if (selectedApplication) {
      const updatedApplication = {
        ...selectedApplication,
        selected: false,
        selectedBy: undefined,
        selectedDate: undefined,
        selectedForCourses: undefined,
        rank: undefined,
      };
      const result = await saveApplication(updatedApplication);

      if (result.success) {
        if (selectedApplication.rank !== undefined) {
          const newRankedApplications = rankedApplications
            .filter(
              (app) =>
                app.id !== selectedApplication.id &&
                app.userId !== selectedApplication.userId
            )
            .map((app, index) => ({ ...app, rank: index + 1 }));

          // Update rankings
          for (const app of newRankedApplications) {
            await saveApplication(app);
          }

          setRankedApplications(newRankedApplications);
        }

        loadApplications();
        setSelectedApplication(updatedApplication);
        showToast("Applicant unselected and removed from ranking!", "success");
      } else {
        showToast(result.message || "Failed to unselect applicant.", "error");
      }
    }
  };

  const handleAddToRanking = async () => {
    if (
      selectedApplication &&
      (selectedApplication.rank === null ||
        selectedApplication.rank === undefined ||
        selectedApplication.rank === 0)
    ) {
      const maxRank = rankedApplications.reduce(
        (max, app) => Math.max(max, app.rank || 0),
        0
      );
      const updatedApplication = {
        ...selectedApplication,
        rank: maxRank + 1,
      };

      const result = await saveApplication(updatedApplication);
      if (result.success) {
        loadApplications();
        setSelectedApplication(updatedApplication);
        showToast("Applicant added to ranking!", "success");
      } else {
        showToast(result.message || "Failed to add to ranking.", "error");
      }
    }
  };

  const handleMoveUp = async (application: TutorApplication) => {
    const currentIndex = rankedApplications.findIndex(
      (app) => app.id === application.id || app.userId === application.userId
    );
    if (currentIndex > 0) {
      const newRankedApplications = [...rankedApplications];
      [
        newRankedApplications[currentIndex],
        newRankedApplications[currentIndex - 1],
      ] = [
        newRankedApplications[currentIndex - 1],
        newRankedApplications[currentIndex],
      ];

      // Update rankings one by one
      for (let index = 0; index < newRankedApplications.length; index++) {
        const app = newRankedApplications[index];
        const updatedApp = { ...app, rank: index + 1 };
        await saveApplication(updatedApp);
      }

      setRankedApplications(newRankedApplications);
      loadApplications();
      showToast("Applicant moved up in ranking!", "success");
    }
  };

  const handleMoveDown = async (application: TutorApplication) => {
    const currentIndex = rankedApplications.findIndex(
      (app) => app.id === application.id || app.userId === application.userId
    );
    if (currentIndex < rankedApplications.length - 1) {
      const newRankedApplications = [...rankedApplications];
      [
        newRankedApplications[currentIndex],
        newRankedApplications[currentIndex + 1],
      ] = [
        newRankedApplications[currentIndex + 1],
        newRankedApplications[currentIndex],
      ];

      // Update rankings one by one
      for (let index = 0; index < newRankedApplications.length; index++) {
        const app = newRankedApplications[index];
        const updatedApp = { ...app, rank: index + 1 };
        await saveApplication(updatedApp);
      }

      setRankedApplications(newRankedApplications);
      loadApplications();
      showToast("Applicant moved down in ranking!", "success");
    }
  };

  const handleRemoveFromRanking = async (applicationId: string) => {
    const appToRemove = rankedApplications.find(
      (app) => app.id === applicationId || app.userId === applicationId
    );
    if (appToRemove) {
      const updatedApplication = { ...appToRemove, rank: undefined };
      await saveApplication(updatedApplication);
      const newRankedApplications = rankedApplications
        .filter(
          (app) => app.id !== applicationId && app.userId !== applicationId
        )
        .map((app, index) => ({ ...app, rank: index + 1 }));

      // Update rankings one by one
      for (const app of newRankedApplications) {
        await saveApplication(app);
      }

      setRankedApplications(newRankedApplications);
      loadApplications();
      showToast("Applicant removed from ranking!", "success");
    }
  };

  return {
    handleSaveComment,
    handleDeleteComment,
    handleSelectApplicantButton,
    handleUnselectApplicant,
    handleAddToRanking,
    handleMoveUp,
    handleMoveDown,
    handleRemoveFromRanking,
  };
};
