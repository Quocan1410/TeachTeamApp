"use client";



import React, { useEffect, useMemo, useState } from "react";

import type { ApplicationResponse } from "@/shared/services/applicationService";

import { ApplicationService } from "@/shared/services/applicationService";

import { buildLecturerApplicationProcessFlow } from "@/shared/utils/lecturerProcessFlow";

import ApplicationProcessRail from "@/modules/tutor/components/application-detail/ApplicationProcessRail";

import ApplicationYourApplication from "@/modules/tutor/components/application-detail/ApplicationYourApplication";

import ApplicationSummaryCard from "@/modules/tutor/components/application-detail/ApplicationSummaryCard";

import { useConfirmModal } from "@/shared/hooks/useConfirmModal";

import overviewStyles from "@/modules/tutor/components/application-detail/ApplicationOverviewScreen.module.css";

import styles from "./LecturerApplicantOverviewScreen.module.css";



interface LecturerApplicantOverviewScreenProps {

  application: ApplicationResponse;

  onOpenChat: () => void;

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



const LecturerApplicantOverviewScreen: React.FC<

  LecturerApplicantOverviewScreenProps

> = ({

  application,

  onOpenChat,

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

  const [lecturerNotes, setLecturerNotes] = useState("");

  const [savedNotes, setSavedNotes] = useState("");

  const [isEditingNotes, setIsEditingNotes] = useState(true);

  const [notesSaving, setNotesSaving] = useState(false);

  const [isRemoving, setIsRemoving] = useState(false);

  const [actionPending, setActionPending] = useState(false);

  const { ask, modal: confirmModal } = useConfirmModal();



  const processFlow = useMemo(

    () => buildLecturerApplicationProcessFlow(application),

    [application]

  );



  const isBlocked = application.candidate?.isBlocked ?? false;

  const isShortlisted = application.isShortlisted ?? false;

  const isSelected = application.status === "selected";

  const isRejected = application.status === "rejected";

  const isPending = application.status === "pending";

  const isRanked =

    application.rank !== null &&

    application.rank !== undefined &&

    application.rank > 0;



  useEffect(() => {

    ApplicationService.getLecturerNotes(application.id).then((res) => {

      const notes =

        res.success && res.data ? res.data.lecturerNotes || "" : "";

      setSavedNotes(notes);

      setLecturerNotes(notes);

      setIsEditingNotes(!notes.trim());

    });

  }, [application.id]);



  const hasSavedNotes = savedNotes.trim().length > 0;

  const showNotesView = hasSavedNotes && !isEditingNotes;

  const notesUnchanged = lecturerNotes.trim() === savedNotes.trim();



  const handleSaveNotes = async () => {

    const trimmed = lecturerNotes.trim();

    if (!trimmed) return;

    setNotesSaving(true);

    try {

      const res = await ApplicationService.updateLecturerNotes(

        application.id,

        trimmed

      );

      if (res.success) {

        const next = (res.data?.lecturerNotes ?? trimmed).trim();

        setSavedNotes(next);

        setLecturerNotes(next);

        setIsEditingNotes(false);

        showToast("Private notes saved", "success");

      } else {

        showToast(res.message || "Failed to save notes", "error");

      }

    } finally {

      setNotesSaving(false);

    }

  };



  const handleDeleteNotes = async () => {

    const confirmed = await ask({

      title: "Delete private notes?",

      message: "These notes will be removed permanently.",

      confirmLabel: "Delete",

      cancelLabel: "Keep",

      variant: "danger",

    });

    if (!confirmed) return;

    setNotesSaving(true);

    try {

      const res = await ApplicationService.updateLecturerNotes(

        application.id,

        ""

      );

      if (res.success) {

        setSavedNotes("");

        setLecturerNotes("");

        setIsEditingNotes(true);

        showToast("Private notes deleted", "success");

      } else {

        showToast(res.message || "Failed to delete notes", "error");

      }

    } finally {

      setNotesSaving(false);

    }

  };



  const runAction = async (action: () => Promise<void>) => {

    try {

      setActionPending(true);

      await action();

    } finally {

      setActionPending(false);

    }

  };



  const handleRemoveBlocked = async () => {

    if (!onRemoveBlockedApplication) return;

    try {

      setIsRemoving(true);

      await onRemoveBlockedApplication();

    } finally {

      setIsRemoving(false);

    }

  };



  const handleAddToRanking = () => {

    if (!isShortlisted) {

      showToast("Shortlist this applicant before adding to ranking", "error");

      return;

    }

    if (isRanked) {

      showToast("Applicant is already in the ranking list", "info");

      return;

    }

    void runAction(onAddToRanking);

  };



  const screeningHint = (() => {

    if (isBlocked) {

      return "Account blocked — remove this application if needed.";

    }

    if (isSelected) {

      return "Final decision recorded. Revoke only if you need to reopen this hire.";

    }

    if (isRejected) {

      return "This profile was declined at screening.";

    }

    if (isRanked) {

      return `Rank #${application.rank} — confirm selection to finalize this hire.`;

    }

    if (isShortlisted) {

      return "Profile passed screening. Add to ranking when ready.";

    }

    return "Does this profile meet your initial criteria?";

  })();



  const screeningActions = (

    <>

      <p className={styles.screeningHint}>{screeningHint}</p>

      <div className={styles.actionRow}>

        {isBlocked ? (

          <button

            type="button"

            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}

            onClick={handleRemoveBlocked}

            disabled={isRemoving || !onRemoveBlockedApplication}

          >

            {isRemoving ? "Removing…" : "Remove application"}

          </button>

        ) : isSelected ? (

          <button

            type="button"

            className={`${styles.actionBtn} ${styles.actionBtnGhost}`}

            onClick={() => void runAction(onRevokeSelection)}

            disabled={actionPending}

          >

            Revoke selection

          </button>

        ) : isRejected ? null : isRanked ? (

          <>

            <button

              type="button"

              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}

              onClick={() => void runAction(onConfirmSelection)}

              disabled={actionPending || application.isWithdrawn}

            >

              Confirm selection

            </button>

            <button

              type="button"

              className={`${styles.actionBtn} ${styles.actionBtnGhost}`}

              onClick={() => void runAction(onRemoveFromRanking)}

              disabled={actionPending}

            >

              Remove from ranking

            </button>

          </>

        ) : isShortlisted ? (

          <>

            <button

              type="button"

              className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}

              onClick={handleAddToRanking}

              disabled={actionPending || application.isWithdrawn}

            >

              Add to ranking

            </button>

            <button

              type="button"

              className={`${styles.actionBtn} ${styles.actionBtnGhost}`}

              onClick={() => void runAction(onRemoveShortlist)}

              disabled={actionPending}

            >

              Remove shortlist

            </button>

          </>

        ) : isPending ? (
          <div className={styles.screeningChoiceRow}>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
              onClick={() => void runAction(onShortlistApplicant)}
              disabled={actionPending || application.isWithdrawn}
              aria-label="Yes, shortlist this profile"
            >
              Yes
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
              onClick={() => void runAction(onDeclineApplicant)}
              disabled={actionPending || application.isWithdrawn}
              aria-label="No, decline this profile"
            >
              No
            </button>
          </div>

        ) : null}

      </div>

    </>

  );



  return (

    <div className={overviewStyles.screen}>

      <header className={overviewStyles.topBar}>

        <h2 className={overviewStyles.panelTitle}>

          <span className="sr-only">Candidate application</span>

          <span className={overviewStyles.panelTitleLine} aria-hidden>

            <span className={overviewStyles.titleComment}>{"//"}</span>

            <span className={overviewStyles.titleIdent}>candidate_application</span>

            <span className={overviewStyles.titlePunct}>;</span>

            <span className={overviewStyles.titleCursor} />

          </span>

        </h2>

      </header>



      <div className={`${overviewStyles.scroll} thinOrangeScroll`}>

        <ApplicationSummaryCard

          application={application}

          variant="lecturer"

          screeningActions={screeningActions}

        />



        <section

          className={overviewStyles.submissionBlock}

          aria-labelledby="lecturer-candidate-submission-heading"

        >

          <h3

            className={overviewStyles.blockHeading}

            id="lecturer-candidate-submission-heading"

          >

            Candidate application

          </h3>

          <ApplicationYourApplication

            application={application}

            contentOnly

            showMinimum

            className={overviewStyles.submissionContent}

          />

        </section>



        <section

          className={overviewStyles.statusBlock}

          aria-labelledby="lecturer-status-heading"

        >

          <div className={overviewStyles.statusHead}>

            <h3 className={overviewStyles.blockHeading} id="lecturer-status-heading">

              Application status

            </h3>

            <p className={overviewStyles.statusMeta}>

              <span className={overviewStyles.statusStep}>

                Step {processFlow.currentStepIndex} of {processFlow.stepCount}

              </span>

              <span className={overviewStyles.statusCaption}>

                {" "}

                · {processFlow.progressCaption}

              </span>

            </p>

          </div>

          <div className={overviewStyles.statusRail}>

            <ApplicationProcessRail flow={processFlow} />

          </div>

        </section>



        <section

          className={overviewStyles.submissionBlock}

          aria-labelledby="lecturer-notes-heading"

        >

          <h3 className={overviewStyles.blockHeading} id="lecturer-notes-heading">

            Private notes

          </h3>

          <div className={styles.notesBlock}>

            <p className={styles.notesHint}>Only visible to you.</p>

            {showNotesView ? (

              <>

                <div className={styles.notesView}>{savedNotes}</div>

                <div className={styles.actionRow}>

                  <button

                    type="button"

                    className={`${styles.actionBtn} ${styles.actionBtnGhost}`}

                    onClick={() => {

                      setLecturerNotes(savedNotes);

                      setIsEditingNotes(true);

                    }}

                    disabled={notesSaving}

                  >

                    Edit

                  </button>

                  <button

                    type="button"

                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}

                    onClick={handleDeleteNotes}

                    disabled={notesSaving}

                  >

                    Delete

                  </button>

                </div>

              </>

            ) : (

              <>

                <textarea

                  className={styles.notesInput}

                  value={lecturerNotes}

                  onChange={(e) => setLecturerNotes(e.target.value)}

                  placeholder="Internal notes, interview reminders…"

                  maxLength={2000}

                  disabled={notesSaving}

                />

                <div className={styles.actionRow}>

                  <button

                    type="button"

                    className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}

                    onClick={handleSaveNotes}

                    disabled={

                      notesSaving ||

                      !lecturerNotes.trim() ||

                      notesUnchanged

                    }

                  >

                    {notesSaving ? "Saving…" : "Save notes"}

                  </button>

                  {hasSavedNotes && (

                    <button

                      type="button"

                      className={`${styles.actionBtn} ${styles.actionBtnGhost}`}

                      onClick={() => {

                        setLecturerNotes(savedNotes);

                        setIsEditingNotes(false);

                      }}

                      disabled={notesSaving}

                    >

                      Cancel

                    </button>

                  )}

                </div>

              </>

            )}

          </div>

        </section>

      </div>



      <footer className={overviewStyles.footer}>

        <button

          type="button"

          className={overviewStyles.openChatBtn}

          onClick={onOpenChat}

        >

          <svg

            className={overviewStyles.openChatIcon}

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

            className={overviewStyles.openChatChevron}

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

      {confirmModal}

    </div>

  );

};



export default LecturerApplicantOverviewScreen;

