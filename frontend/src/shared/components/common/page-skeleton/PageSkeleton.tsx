"use client";

import React, { useEffect } from "react";
import styles from "./PageSkeleton.module.css";
import { retainPageBusy } from "@/shared/components/route-pending/loadingIndicator";

interface PageSkeletonProps {
  cards?: number;
  variant?:
    | "default"
    | "lecturer"
    | "tutor"
    | "profile"
    | "auth"
    | "home"
    | "applications"
    | "plain";
  /** Full viewport shell for route-level loading; false for in-page sections */
  fullPage?: boolean;
}

const PageSkeleton: React.FC<PageSkeletonProps> = ({
  cards = 6,
  variant = "default",
  fullPage = true,
}) => {
  const renderBody = () => {
    if (variant === "plain") {
      return null;
    }

    if (variant === "auth") {
      return (
        <div className={styles.pageSkeleton__authWrap}>
          <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__authCard}`}>
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__authTitle}`} />
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__authInput}`} />
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__authInput}`} />
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__authButton}`} />
          </div>
        </div>
      );
    }

    if (variant === "profile") {
      return (
        <div className={styles.pageSkeleton__profileColumn}>
          <div className={`${styles.pageSkeleton__profileCard} ${styles.pageSkeleton__profileCardCenter}`}>
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__avatar}`} />
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileName}`} />
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileBadge}`} />
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileLineShort}`} />
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileStat}`} />
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileStat}`} />
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileSecurity}`} />
          </div>
          <div className={styles.pageSkeleton__profileCard}>
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileSectionTitle}`} />
            <div className={styles.pageSkeleton__fieldList}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`field-${index}`} className={styles.pageSkeleton__fieldRow}>
                  <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__fieldLabel}`} />
                  <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__fieldValue}`} />
                </div>
              ))}
            </div>
          </div>
          <div className={styles.pageSkeleton__profileCard}>
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileSectionTitle}`} />
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileStat}`} />
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileStat}`} />
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileButton}`} />
          </div>
        </div>
      );
    }

    if (variant === "lecturer") {
      return (
        <>
          <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__hero}`} />
          <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__filterBar}`} />
          <div className={styles.pageSkeleton__splitLayout}>
            <div className={styles.pageSkeleton__leftColumn}>
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={`left-${index}`}
                  className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__listItem}`}
                />
              ))}
            </div>
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__detailPanel}`} />
          </div>
        </>
      );
    }

    if (variant === "home") {
      const lecturers = (
        <div className={styles.pageSkeleton__homeLecturers}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`home-${index}`} className={styles.pageSkeleton__homeLecturer}>
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__homeLecturerPhoto}`} />
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__homeLecturerName}`} />
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__homeLecturerMeta}`} />
            </div>
          ))}
        </div>
      );

      if (!fullPage) {
        return lecturers;
      }

      return (
        <div className={styles.pageSkeleton__homeLayout}>
          <div className={styles.pageSkeleton__homeHero}>
            <div className={styles.pageSkeleton__homeCopy}>
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__homeTitle}`} />
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__homeTitle}`} />
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__homeTitleShort}`} />
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__homeSubtitle}`} />
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__homeButton}`} />
            </div>
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__homeArt}`} />
          </div>

          <div className={styles.pageSkeleton__homeStats}>
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__homeStatNumber}`} />
            <div className={styles.pageSkeleton__homeStatCopy}>
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__homeStatLine}`} />
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__homeStatLineShort}`} />
              <div className={styles.pageSkeleton__homeAvatars}>
                {Array.from({ length: 9 }).map((_, index) => (
                  <div
                    key={`avatar-${index}`}
                    className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__homeAvatar}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className={styles.pageSkeleton__homeTimeline}>
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__homeSectionTitle}`} />
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`step-${index}`}
                className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__homeStep}`}
              />
            ))}
          </div>

          <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__homeSectionTitle}`} />
          {lecturers}
        </div>
      );
    }

    if (variant === "applications") {
      return (
        <>
          <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__filterBar}`} />
          <div className={styles.pageSkeleton__applicationList}>
            {Array.from({ length: Math.max(cards, 4) }).map((_, index) => (
              <div
                key={`application-${index}`}
                className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__listItem}`}
              />
            ))}
          </div>
        </>
      );
    }

    if (variant === "tutor") {
      return (
        <div className={styles.pageSkeleton__tutorPage}>
          <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__tutorTitle}`} />
          <div className={styles.pageSkeleton__tutorSearchHead}>
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__tutorSearchLabel}`} />
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__tutorClear}`} />
          </div>
          <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__tutorSearchField}`} />
          <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__tutorFilterLabel}`} />
          <div className={styles.pageSkeleton__tutorFilters}>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`tutor-filter-${index}`}
                className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__tutorFilter}`}
              />
            ))}
          </div>
          <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__tutorApply}`} />
          <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__tutorNotice}`} />
          <div className={styles.pageSkeleton__tutorGrid}>
            {Array.from({ length: Math.max(cards, 6) }).map((_, index) => (
              <div
                key={`tutor-${index}`}
                className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__cardTall}`}
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <>
        <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__title}`} />
        <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__subtitle}`} />
        <div className={styles.pageSkeleton__grid}>
          {Array.from({ length: cards }).map((_, index) => (
            <div key={index} className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__card}`} />
          ))}
        </div>
      </>
    );
  };

  useEffect(() => {
    return retainPageBusy();
  }, []);

  const body = renderBody();

  const status = (
    <p className={styles.pageSkeleton__srOnly} role="status">
      Loading…
    </p>
  );

  if (!fullPage) {
    return (
      <div aria-busy="true" aria-live="polite">
        {status}
        {body}
      </div>
    );
  }

  return (
    <div
      className={`${styles.pageSkeleton__wrapper} ${
        variant === "tutor" ? styles.pageSkeleton__wrapperTutor : ""
      }`}
      aria-busy="true"
      aria-live="polite"
    >
      <div className={styles.pageSkeleton__container}>
        {status}
        {body}
      </div>
    </div>
  );
};

export default PageSkeleton;
