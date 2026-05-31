"use client";



import React, { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { ApplicationResponse } from "@/shared/services/applicationService";
import { ApplicationService } from "@/shared/services/applicationService";
import { applicationHasLecturerReview } from "@/shared/utils/applicationStatus";

import {

  detailViewVariants,

  getDetailViewTransition,

  type DetailNavDirection,

} from "@/modules/tutor/components/application-detail/detailViewMotion";

import panelStyles from "@/modules/tutor/components/application-detail/ApplicationDetailPanel.module.css";

import LecturerApplicantOverviewScreen from "./LecturerApplicantOverviewScreen";

import LecturerApplicationChatScreen from "@/modules/lecturer/components/application-chat/LecturerApplicationChatScreen";

import emptyStyles from "./LecturerApplicantDetailPanel.module.css";



type DetailView = "overview" | "chat";

const reviewMarkSentForApplicationIds = new Set<number>();



interface LecturerApplicantDetailPanelProps {

  application: ApplicationResponse | null;

  onApplicationUpdated: (application: ApplicationResponse) => void;

  /** Refreshes applicant list after chat actions (comment, reactions). */
  onApplicationChatUpdated?: (application: ApplicationResponse) => void;

  onShortlistApplicant: () => Promise<void>;

  onDeclineApplicant: () => Promise<void>;

  onRemoveShortlist: () => Promise<void>;

  onConfirmSelection: () => Promise<void>;

  onRevokeSelection: () => Promise<void>;

  onAddToRanking: () => Promise<void>;

  onRemoveFromRanking: () => Promise<void>;

  onRemoveBlockedApplication?: () => Promise<void>;

  showToast: (message: string, type?: "success" | "error" | "info") => void;

}



const LecturerApplicantDetailPanel: React.FC<LecturerApplicantDetailPanelProps> =

  ({

    application,

    onApplicationUpdated,
    onApplicationChatUpdated,

    onShortlistApplicant,

    onDeclineApplicant,

    onRemoveShortlist,

    onConfirmSelection,

    onRevokeSelection,

    onAddToRanking,

    onRemoveFromRanking,

    onRemoveBlockedApplication,

    showToast,

  }) => {

    const [view, setView] = useState<DetailView>("overview");

    const [direction, setDirection] = useState<DetailNavDirection>(1);

    const reduceMotion = useReducedMotion();

    const viewTransition = getDetailViewTransition(reduceMotion);



    const openChat = useCallback(() => {
      setDirection(1);
      setView("chat");
    }, []);

    const backToOverview = useCallback(() => {
      setDirection(-1);
      setView("overview");
    }, []);

    useEffect(() => {
      setView("overview");
      setDirection(1);
    }, [application?.id]);

    const onApplicationUpdatedRef = useRef(onApplicationUpdated);
    useEffect(() => {
      onApplicationUpdatedRef.current = onApplicationUpdated;
    }, [onApplicationUpdated]);

    useEffect(() => {
      const applicationId = application?.id;
      const reviewSnapshot = {
        reviewedAt: application?.reviewedAt,
        comment: application?.comment,
        correspondenceMessages: application?.correspondenceMessages,
      };

      if (!applicationId || applicationHasLecturerReview(reviewSnapshot)) {
        return;
      }
      if (reviewMarkSentForApplicationIds.has(applicationId)) {
        return;
      }

      reviewMarkSentForApplicationIds.add(applicationId);
      let cancelled = false;

      void ApplicationService.markApplicationReviewed(applicationId).then(
        (response) => {
          if (cancelled || !response.success || !response.data?.reviewedAt) {
            if (!response.success) {
              reviewMarkSentForApplicationIds.delete(applicationId);
            }
            return;
          }
          onApplicationUpdatedRef.current(response.data);
        }
      );

      return () => {
        cancelled = true;
      };
    }, [
      application?.id,
      application?.reviewedAt,
      application?.comment,
      application?.correspondenceMessages,
    ]);



    if (!application) {

      return (

        <aside className={panelStyles.panel} aria-label="Applicant details">

          <div className={emptyStyles.emptyState}>

            <p className={emptyStyles.emptyTitle}>No applicant selected</p>

            <p className={emptyStyles.emptyText}>

              Select an applicant from the list to review their application.

            </p>

          </div>

        </aside>

      );

    }



    return (

      <aside className={panelStyles.panel} aria-label="Applicant details">

        <div className={panelStyles.viewStage}>

          <AnimatePresence initial={false} custom={direction}>

            {view === "overview" ? (

              <motion.div

                key={`overview-${application.id}`}

                className={panelStyles.viewPage}

                custom={direction}

                variants={detailViewVariants}

                initial="initial"

                animate="animate"

                exit="exit"

                transition={viewTransition}

              >

                <LecturerApplicantOverviewScreen

                  application={application}

                  onOpenChat={openChat}

                  onShortlistApplicant={onShortlistApplicant}

                  onDeclineApplicant={onDeclineApplicant}

                  onRemoveShortlist={onRemoveShortlist}

                  onConfirmSelection={onConfirmSelection}

                  onRevokeSelection={onRevokeSelection}

                  onAddToRanking={onAddToRanking}

                  onRemoveFromRanking={onRemoveFromRanking}

                  onRemoveBlockedApplication={onRemoveBlockedApplication}

                  showToast={showToast}

                />

              </motion.div>

            ) : (

              <motion.div

                key={`chat-${application.id}`}

                className={panelStyles.viewPage}

                custom={direction}

                variants={detailViewVariants}

                initial="initial"

                animate="animate"

                exit="exit"

                transition={viewTransition}

              >

                <LecturerApplicationChatScreen

                  application={application}

                  onApplicationUpdated={
                    onApplicationChatUpdated ?? onApplicationUpdated
                  }

                  onBack={backToOverview}

                  showToast={showToast}

                />

              </motion.div>

            )}

          </AnimatePresence>

        </div>

      </aside>

    );

  };



export default LecturerApplicantDetailPanel;

