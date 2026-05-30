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
    <div className={styles.screen}>
      <header className={styles.topBar}>
        <h2 className={styles.panelTitle} id="overview-submission-heading">
          <span className="sr-only">What you submitted</span>
          <span className={styles.panelTitleLine} aria-hidden>
            <span className={styles.titleComment}>{"//"}</span>
            <span className={styles.titleIdent}>what_you_submitted</span>
            <span className={styles.titlePunct}>;</span>
            <span className={styles.titleCursor} />
          </span>
        </h2>
        <div className={styles.topBarActions}>
          <ApplicationDetailHeroActions
            isPinned={isPinned}
            onTogglePin={onTogglePin}
            onClose={onClose}
          />
        </div>
      </header>

      <div className={`${styles.scroll} thinOrangeScroll`}>
        <ApplicationSummaryCard application={application} />

        <section
          className={styles.submissionBlock}
          aria-labelledby="overview-my-application-heading"
        >
          <h3
            className={styles.blockHeading}
            id="overview-my-application-heading"
          >
            My application
          </h3>
          <ApplicationYourApplication
            application={application}
            contentOnly
            showMinimum
            className={styles.submissionContent}
          />
        </section>

        <section
          className={styles.statusBlock}
          aria-labelledby="overview-status-heading"
        >
          <div className={styles.statusHead}>
            <h3 className={styles.blockHeading} id="overview-status-heading">
              Application status
            </h3>
            <p className={styles.statusMeta}>
              <span className={styles.statusStep}>
                Step {processFlow.currentStepIndex} of {processFlow.stepCount}
              </span>
              <span className={styles.statusCaption}>
                {" "}
                · {processFlow.progressCaption}
              </span>
            </p>
          </div>
          <div className={styles.statusRail}>
            <ApplicationProcessRail flow={processFlow} />
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.openChatBtn}
          onClick={onOpenChat}
        >
          <svg
            className={styles.openChatIcon}
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
            className={styles.openChatChevron}
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
