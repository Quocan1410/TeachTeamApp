"use client";

import React, { useMemo } from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import { buildApplicationProcessFlow } from "@/shared/utils/applicationProcessFlow";
import ApplicationProcessRail from "./ApplicationProcessRail";
import ApplicationYourApplication from "./ApplicationYourApplication";
import ApplicationSummaryCard from "./ApplicationSummaryCard";
import ApplicationDetailHeroActions from "./ApplicationDetailHeroActions";
import styles from "./ApplicationOverviewScreen.module.css";

interface ApplicationOverviewScreenProps {
  application: ApplicationResponse;
  isPinned: boolean;
  onOpenChat: () => void;
  onTogglePin: () => void;
  onClose: () => void;
}

const ApplicationOverviewScreen: React.FC<ApplicationOverviewScreenProps> = ({
  application,
  isPinned,
  onOpenChat,
  onTogglePin,
  onClose,
}) => {
  const processFlow = useMemo(
    () => buildApplicationProcessFlow(application),
    [application]
  );

  return (
    <div className={styles.applicationOverviewScreen__screen}>
      <header className={styles.applicationOverviewScreen__topBar}>
        <h2 className={styles.applicationOverviewScreen__panelTitle} id="overview-submission-heading">
          <span className="sr-only">What you submitted</span>
          <span className={styles.applicationOverviewScreen__panelTitleLine} aria-hidden>
            <span className={styles.applicationOverviewScreen__titleComment}>{"//"}</span>
            <span className={styles.applicationOverviewScreen__titleIdent}>what_you_submitted</span>
            <span className={styles.applicationOverviewScreen__titlePunct}>;</span>
            <span className={styles.applicationOverviewScreen__titleCursor} />
          </span>
        </h2>
        <div className={styles.applicationOverviewScreen__topBarActions}>
          <ApplicationDetailHeroActions
            isPinned={isPinned}
            onTogglePin={onTogglePin}
            onClose={onClose}
          />
        </div>
      </header>

      <div className={`${styles.applicationOverviewScreen__scroll} scrollbar__thin`}>
        <ApplicationSummaryCard application={application} />

        <section
          className={styles.applicationOverviewScreen__submissionBlock}
          aria-labelledby="overview-my-application-heading"
        >
          <h3
            className={styles.applicationOverviewScreen__blockHeading}
            id="overview-my-application-heading"
          >
            My application
          </h3>
          <ApplicationYourApplication
            application={application}
            contentOnly
            showMinimum
            className={styles.applicationOverviewScreen__submissionContent}
          />
        </section>

        <section
          className={styles.applicationOverviewScreen__statusBlock}
          aria-labelledby="overview-status-heading"
        >
          <div className={styles.applicationOverviewScreen__statusHead}>
            <h3 className={styles.applicationOverviewScreen__blockHeading} id="overview-status-heading">
              Application status
            </h3>
            <p className={styles.applicationOverviewScreen__statusMeta}>
              <span className={styles.applicationOverviewScreen__statusStep}>
                Step {processFlow.currentStepIndex} of {processFlow.stepCount}
              </span>
              <span className={styles.applicationOverviewScreen__statusCaption}>
                {" "}
                · {processFlow.progressCaption}
              </span>
            </p>
          </div>
          <div className={styles.applicationOverviewScreen__statusRail}>
            <ApplicationProcessRail flow={processFlow} />
          </div>
        </section>
      </div>

      <footer className={styles.applicationOverviewScreen__footer}>
        <button
          type="button"
          className={styles.applicationOverviewScreen__openChatBtn}
          onClick={onOpenChat}
        >
          <svg
            className={styles.applicationOverviewScreen__openChatIcon}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Open chat
          <svg
            className={styles.applicationOverviewScreen__openChatChevron}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M9 18l6-6-6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </footer>
    </div>
  );
};

export default ApplicationOverviewScreen;
