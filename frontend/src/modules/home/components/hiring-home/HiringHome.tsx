"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  PublicService,
  type PublicOpening,
} from "@/shared/services/publicService";
import { formatAppliedDate } from "@/shared/utils/applicationFormat";
import buttonStyles from "@/shared/components/common/Button/Button.module.css";
import styles from "./HiringHome.module.css";

interface HiringHomeProps {
  isLoggedIn: boolean;
  userRole: string | null;
}

function placeLabel(count: number): string {
  return count === 1 ? "1 place" : `${count} places`;
}

function openingState(opening: PublicOpening): "Open" | "Full" | "Closed" {
  if (!opening.isApplicationOpen) return "Closed";
  if (opening.tutorPlacesLeft + opening.labAssistantPlacesLeft === 0) {
    return "Full";
  }
  return "Open";
}

const STEPS = [
  {
    title: "Create an account",
    text: "Use your university email. The account is how lecturers see your application.",
  },
  {
    title: "Apply for one course and one role",
    text: "Choose tutor or lab assistant on a course that is still open.",
  },
  {
    title: "Wait for the decision",
    text: "The lecturer ranks applicants and selects a candidate. You get a notification.",
  },
];

export default function HiringHome({ isLoggedIn, userRole }: HiringHomeProps) {
  const [openings, setOpenings] = useState<PublicOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOpenings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOpenings(await PublicService.getOpenings());
    } catch {
      setError("Open roles could not be loaded. Try again.");
      setOpenings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOpenings();
  }, [loadOpenings]);

  const dashboardHref =
    userRole === "lecturer"
      ? "/lecturer"
      : userRole === "candidate"
        ? "/tutor"
        : "/signin";

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>School of Computer Science</p>
        <h1 className={styles.title}>
          Apply for a tutor or lab assistant role
        </h1>
        <p className={styles.lead}>
          Roles are listed by course for this semester. Sign in to apply. A
          lecturer reviews the application and selects who fills the place.
        </p>
        <div className={styles.actions}>
          {isLoggedIn ? (
            <Link
              href={dashboardHref}
              className={`${buttonStyles.btn} ${buttonStyles.btnPrimary}`}
            >
              {userRole === "lecturer" ? "Open lecturer home" : "Open your applications"}
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className={`${buttonStyles.btn} ${buttonStyles.btnPrimary}`}
              >
                Create an account
              </Link>
              <Link
                href="/signin"
                className={`${buttonStyles.btn} ${buttonStyles.btnOutline}`}
              >
                Sign in
              </Link>
            </>
          )}
          <a href="#open-roles" className={styles.textLink}>
            View open roles
          </a>
        </div>
      </section>

      <section id="open-roles" className={styles.section}>
        <h2 className={styles.sectionTitle}>Open roles</h2>
        <p className={styles.sectionLead}>
          A role stays open while the deadline has not passed and a place is
          left.
        </p>

        {loading && (
          <p className={styles.status} role="status">
            Loading open roles…
          </p>
        )}

        {!loading && error && (
          <div className={styles.statusBlock}>
            <p className={styles.status}>{error}</p>
            <button type="button" className={styles.retry} onClick={loadOpenings}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && openings.length === 0 && (
          <p className={styles.status}>No courses are listed yet.</p>
        )}

        {!loading && !error && openings.length > 0 && (
          <div className={styles.list}>
            {openings.map((opening) => {
              const state = openingState(opening);
              return (
                <article key={opening.courseId} className={styles.row}>
                  <div className={styles.rowMain}>
                    <div className={styles.rowTitle}>
                      <h3>
                        {opening.courseCode} · {opening.courseName}
                      </h3>
                      <span
                        className={
                          state === "Open" ? styles.badgeOpen : styles.badgeClosed
                        }
                      >
                        {state}
                      </span>
                    </div>
                    <p className={styles.meta}>
                      {opening.semester}
                      {" · "}
                      {opening.lecturers.length > 0
                        ? opening.lecturers.join(", ")
                        : "Lecturer not assigned"}
                    </p>
                  </div>
                  <dl className={styles.places}>
                    <div>
                      <dt>Tutor</dt>
                      <dd>{placeLabel(opening.tutorPlacesLeft)}</dd>
                    </div>
                    <div>
                      <dt>Lab assistant</dt>
                      <dd>{placeLabel(opening.labAssistantPlacesLeft)}</dd>
                    </div>
                    <div>
                      <dt>Deadline</dt>
                      <dd>
                        {opening.applicationDeadline
                          ? formatAppliedDate(opening.applicationDeadline)
                          : "No deadline"}
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How selection works</h2>
        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className={styles.stepIndex}>{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
