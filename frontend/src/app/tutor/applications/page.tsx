"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import {
  ApplicationResponse,
  ApplicationService,
} from "@/shared/services/applicationService";
import { useToast } from "@/shared/hooks/useNotification";
import { useApplicationRealtime } from "@/shared/hooks/useApplicationRealtime";
import { usePinnedApplications } from "@/shared/hooks/usePinnedApplications";
import type { ApplicationUpdatedPayload } from "@/shared/socket/applicationEvents";
import Toast from "@/shared/components/common/toast/toast";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";
import ApplicationsHeroSection from "@/modules/tutor/components/hero-section/ApplicationsHeroSection";
import ApplicationStatusBadge from "@/shared/components/common/application-status-badge/ApplicationStatusBadge";
import PinIcon from "@/shared/components/common/icons/PinIcon";
import ApplicationDetailPanel from "@/modules/tutor/components/application-detail/ApplicationDetailPanel";
import styles from "./ApplicationsPage.module.css";

type ViewMode = "grid" | "list";

const formatRoleLabel = (roleName: string) =>
  roleName === "tutor" ? "Tutor" : "Lab Assistant";

const formatAppliedDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function TutorApplicationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const { togglePin, isPinned } = usePinnedApplications();
  const selectedIdRef = useRef<number | null>(null);
  const listPaneRef = useRef<HTMLDivElement>(null);
  const preserveWindowScrollY = useRef<number | null>(null);
  const preserveListScrollTop = useRef<number | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const captureScrollPositions = useCallback(() => {
    preserveWindowScrollY.current = window.scrollY;
    if (listPaneRef.current) {
      preserveListScrollTop.current = listPaneRef.current.scrollTop;
    }
  }, []);

  const restoreScrollPositions = useCallback(() => {
    if (preserveWindowScrollY.current !== null) {
      window.scrollTo({
        top: preserveWindowScrollY.current,
        left: 0,
        behavior: "instant",
      });
    }
    if (preserveListScrollTop.current !== null && listPaneRef.current) {
      listPaneRef.current.scrollTop = preserveListScrollTop.current;
    }
  }, []);

  useLayoutEffect(() => {
    restoreScrollPositions();
  }, [selectedId, restoreScrollPositions]);

  useEffect(() => {
    const winY = preserveWindowScrollY.current;
    const listTop = preserveListScrollTop.current;
    if (winY === null && listTop === null) return;

    const frame = requestAnimationFrame(() => {
      if (winY !== null) {
        window.scrollTo({ top: winY, left: 0, behavior: "instant" });
      }
      if (listTop !== null && listPaneRef.current) {
        listPaneRef.current.scrollTop = listTop;
      }
      preserveWindowScrollY.current = null;
      preserveListScrollTop.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId]);

  const mergeApplications = useCallback((data: ApplicationResponse[]) => {
    setApplications(data);
    setDrafts((prev) => {
      const next = { ...prev };
      data.forEach((app) => {
        if (next[app.id] === undefined) {
          next[app.id] = "";
        }
      });
      return next;
    });
  }, []);

  const sortedApplications = useMemo(() => {
    const list = [...applications];
    list.sort(
      (a, b) =>
        new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );
    return list;
  }, [applications]);

  const selectedApplication = useMemo(
    () => sortedApplications.find((a) => a.id === selectedId) ?? null,
    [sortedApplications, selectedId]
  );

  const selectApplication = useCallback(
    (id: number) => {
      captureScrollPositions();
      setSelectedId(id);
    },
    [captureScrollPositions]
  );

  const clearSelection = useCallback(() => {
    captureScrollPositions();
    setSelectedId(null);
  }, [captureScrollPositions]);

  /** Prevent focus scroll + capture list position before click (html scroll-behavior: smooth). */
  const onListCardMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    captureScrollPositions();
  };

  const heroStats = useMemo(() => {
    const inReview = applications.filter(
      (a) => !a.isWithdrawn && a.status === "pending"
    ).length;
    const selected = applications.filter(
      (a) => a.status === "selected" && !a.isWithdrawn
    ).length;
    const closed = applications.filter(
      (a) => a.isWithdrawn || a.status === "rejected"
    ).length;
    const total = applications.length;
    return { total, inReview, selected, closed };
  }, [applications]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.replace("/signin");
      return;
    }
    if (user.userType !== "candidate") {
      router.replace(user.userType === "lecturer" ? "/lecturer" : "/");
      return;
    }

    const load = async () => {
      setLoading(true);
      const response = await ApplicationService.getMyCandidateApplications();
      if (!response.success || !response.data) {
        showError(response.message || "Failed to load applications");
        setLoading(false);
        return;
      }
      mergeApplications(response.data);
      if (response.data.length > 0) {
        setSelectedId((prev) =>
          prev && response.data!.some((a) => a.id === prev) ? prev : null
        );
      }
      setLoading(false);
    };
    load();
  }, [
    authLoading,
    isAuthenticated,
    mergeApplications,
    router,
    showError,
    user,
  ]);

  const handleApplicationUpdated = useCallback(
    (payload: ApplicationUpdatedPayload) => {
      const { application, reason } = payload;

      setApplications((prev) => {
        const index = prev.findIndex((item) => item.id === application.id);
        if (index === -1) {
          return reason === "created" ? [application, ...prev] : prev;
        }
        const next = [...prev];
        next[index] = application;
        return next;
      });

      setDrafts((prev) => {
        if (prev[application.id] !== undefined) {
          return prev;
        }
        return {
          ...prev,
          [application.id]: "",
        };
      });

      if (selectedIdRef.current !== application.id) {
        return;
      }

      if (reason === "comment" && application.comment?.trim()) {
        showSuccess("New feedback from your lecturer.");
        return;
      }

      if (reason === "status") {
        if (application.status === "selected") {
          showSuccess("You've been selected for this role.");
        } else if (application.status === "rejected" && !application.isWithdrawn) {
          showError("Your application status was updated.");
        }
      }
    },
    [showError, showSuccess]
  );

  useApplicationRealtime({
    enabled:
      !authLoading &&
      isAuthenticated &&
      user?.userType === "candidate" &&
      !loading,
    onApplicationUpdated: handleApplicationUpdated,
  });

  const sendNewMessage = async (
    applicationId: number,
    replyToMessageId?: string | null
  ) => {
    const content = drafts[applicationId]?.trim() ?? "";
    if (!content) {
      showError("Response cannot be empty.");
      return;
    }
    setBusyId(applicationId);
    const response = await ApplicationService.updateCandidateResponse(
      applicationId,
      content,
      replyToMessageId
    );
    if (!response.success || !response.data) {
      showError(response.message || "Failed to send response");
      setBusyId(null);
      return;
    }
    setApplications((prev) =>
      prev.map((item) => (item.id === applicationId ? response.data! : item))
    );
    setDrafts((prev) => ({
      ...prev,
      [applicationId]: "",
    }));
    setBusyId(null);
  };

  const editMessage = async (applicationId: number, messageId: string) => {
    const content = drafts[applicationId]?.trim() ?? "";
    if (!content) {
      showError("Response cannot be empty.");
      return;
    }
    setBusyId(applicationId);
    const response = await ApplicationService.editCorrespondenceMessage(
      applicationId,
      messageId,
      content
    );
    if (!response.success || !response.data) {
      showError(response.message || "Failed to update message");
      setBusyId(null);
      return;
    }
    setApplications((prev) =>
      prev.map((item) => (item.id === applicationId ? response.data! : item))
    );
    setDrafts((prev) => ({
      ...prev,
      [applicationId]: "",
    }));
    setBusyId(null);
  };

  const deleteMessage = async (applicationId: number, messageId: string) => {
    setBusyId(applicationId);
    const response = await ApplicationService.deleteCandidateResponse(
      applicationId,
      messageId
    );
    if (!response.success || !response.data) {
      showError(response.message || "Failed to delete message");
      setBusyId(null);
      return;
    }
    setApplications((prev) =>
      prev.map((item) => (item.id === applicationId ? response.data! : item))
    );
    setDrafts((prev) => ({
      ...prev,
      [applicationId]: "",
    }));
    setBusyId(null);
  };

  const toggleReaction = async (
    applicationId: number,
    messageId: string,
    emoji: string
  ) => {
    const response = await ApplicationService.toggleMessageReaction(
      applicationId,
      messageId,
      emoji
    );
    if (!response.success || !response.data) {
      showError(response.message || "Failed to update reaction");
      return;
    }
    setApplications((prev) =>
      prev.map((item) => (item.id === applicationId ? response.data! : item))
    );
  };

  const withdraw = async (applicationId: number) => {
    if (
      !window.confirm(
        "Withdraw this application? You will not be able to undo this."
      )
    ) {
      return;
    }
    setBusyId(applicationId);
    const response = await ApplicationService.withdrawApplication(applicationId);
    if (!response.success || !response.data) {
      showError(response.message || "Failed to withdraw");
      setBusyId(null);
      return;
    }
    setApplications((prev) =>
      prev.map((item) => (item.id === applicationId ? response.data! : item))
    );
    showSuccess("Application withdrawn.");
    setBusyId(null);
  };

  if (authLoading || loading) {
    return <PageSkeleton variant="tutor" />;
  }

  const hasSelection = selectedApplication !== null;

  const renderListCard = (application: ApplicationResponse) => {
    const isActive = hasSelection && selectedId === application.id;
    const pinned = isPinned(application.id);

    return (
      <button
        key={application.id}
        type="button"
        className={`${styles.listCard} ${isActive ? styles.listCardActive : ""} ${
          pinned ? styles.listCardPinned : ""
        } ${
          pinned && !hasSelection ? styles.listCardPinnedFirst : ""
        }`}
        onMouseDown={onListCardMouseDown}
        onClick={() => selectApplication(application.id)}
      >
        {pinned && (
          <span className={styles.cardPinTab} title="Pinned">
            <span className={styles.cardPinTabChip} aria-hidden>
              <PinIcon />
            </span>
          </span>
        )}
        <div className={styles.listCardBody}>
          <div className={styles.listCardRowTop}>
            <p className={styles.listEyebrow}>
              <span className={styles.listCourse}>
                {application.course.courseCode}
              </span>
              <span className={styles.listEyebrowDot} aria-hidden>
                ·
              </span>
              <span>{application.course.semester}</span>
            </p>
            <div className={styles.listCardStatus}>
              <ApplicationStatusBadge
                status={application.status}
                isWithdrawn={application.isWithdrawn}
              />
            </div>
          </div>

          <h3 className={styles.listTitle}>{application.course.courseName}</h3>
          <p className={styles.listDescription}>
            {application.course.description || "No description available."}
          </p>

          <div className={styles.listCardRowBottom}>
            <div
              className={`${styles.listRole} ${
                application.role.roleName === "tutor"
                  ? styles.listRoleTutor
                  : styles.listRoleAssistant
              }`}
            >
              <span className={styles.listRoleIcon} aria-hidden>
                {application.role.roleName === "tutor" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              <span className={styles.listRoleLabel}>
                {formatRoleLabel(application.role.roleName)}
              </span>
            </div>
            <p className={styles.listDate}>
              Applied {formatAppliedDate(application.appliedAt)}
            </p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <>
      <ApplicationsHeroSection
        total={heroStats.total}
        inReview={heroStats.inReview}
        selected={heroStats.selected}
        closed={heroStats.closed}
      />

      <main className={styles.page} data-applications-page>
        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onClose={hideToast}
          variant="toast"
          position="bottom-left"
        />

        {sortedApplications.length === 0 ? (
          <div className={styles.empty}>
            <p>You have not submitted any applications yet.</p>
            <Link href="/tutor" className={styles.emptyCta}>
              Browse courses
            </Link>
          </div>
        ) : (
          <>
            <div
              className={`${styles.toolbar} ${
                hasSelection ? styles.toolbarCompact : ""
              }`}
            >
              {!hasSelection && (
                <div
                  className={styles.viewToggle}
                  role="group"
                  aria-label="View mode"
                >
                  <button
                    type="button"
                    className={`${styles.viewBtn} ${
                      viewMode === "grid" ? styles.viewBtnActive : ""
                    }`}
                    onClick={() => setViewMode("grid")}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    className={`${styles.viewBtn} ${
                      viewMode === "list" ? styles.viewBtnActive : ""
                    }`}
                    onClick={() => setViewMode("list")}
                  >
                    List
                  </button>
                </div>
              )}
              {hasSelection ? (
                <p className={styles.hint}>
                  <span className={styles.stackCount}>
                    {sortedApplications.length} applications
                  </span>
                  <span className={styles.hintSep} aria-hidden>
                    ·
                  </span>
                  Select another card in the list to switch
                </p>
              ) : (
                <p className={styles.hint}>Click a card to open details</p>
              )}
            </div>

            <div
              className={`${styles.workspace} ${
                hasSelection ? styles.workspaceSplit : ""
              }`}
            >
              <div
                className={
                  hasSelection ? styles.leftColumn : styles.listHostWide
                }
              >
                <div
                  className={
                    hasSelection ? styles.stackSection : styles.listHostInner
                  }
                >
                  <div
                    ref={listPaneRef}
                    className={`${styles.listPane} ${
                      hasSelection
                        ? styles.listPaneStack
                        : viewMode === "grid"
                          ? styles.listPaneGrid
                          : styles.listPaneList
                    }`}
                  >
                    {sortedApplications.map((application) =>
                      renderListCard(application)
                    )}
                  </div>
                </div>
              </div>

              {selectedApplication && (
                <aside className={styles.detailColumn}>
                  <ApplicationDetailPanel
                    application={selectedApplication}
                    draft={drafts[selectedApplication.id] ?? ""}
                    busy={busyId === selectedApplication.id}
                    isPinned={isPinned(selectedApplication.id)}
                    hideSummary
                    onDraftChange={(value) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [selectedApplication.id]: value,
                      }))
                    }
                    onSendNew={(replyToMessageId) =>
                      sendNewMessage(selectedApplication.id, replyToMessageId)
                    }
                    onEditMessage={(messageId) =>
                      editMessage(selectedApplication.id, messageId)
                    }
                    onDeleteMessage={(messageId) =>
                      deleteMessage(selectedApplication.id, messageId)
                    }
                    onWithdraw={() => withdraw(selectedApplication.id)}
                    onClose={clearSelection}
                    onTogglePin={() => togglePin(selectedApplication.id)}
                    onToggleReaction={(messageId, emoji) =>
                      toggleReaction(
                        selectedApplication.id,
                        messageId,
                        emoji
                      )
                    }
                  />
                </aside>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
