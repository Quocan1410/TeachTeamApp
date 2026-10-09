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
        <div className={styles.authWrap}>
          <div className={`${styles.pulse} ${styles.authCard}`}>
            <div className={`${styles.pulse} ${styles.authTitle}`} />
            <div className={`${styles.pulse} ${styles.authInput}`} />
            <div className={`${styles.pulse} ${styles.authInput}`} />
            <div className={`${styles.pulse} ${styles.authButton}`} />
          </div>
        </div>
      );
    }

    if (variant === "profile") {
      return (
        <div className={styles.profileColumn}>
          <div className={`${styles.profileCard} ${styles.profileCardCenter}`}>
            <div className={`${styles.pulse} ${styles.avatar}`} />
            <div className={`${styles.pulse} ${styles.profileName}`} />
            <div className={`${styles.pulse} ${styles.profileBadge}`} />
            <div className={`${styles.pulse} ${styles.profileLineShort}`} />
            <div className={`${styles.pulse} ${styles.profileStat}`} />
            <div className={`${styles.pulse} ${styles.profileStat}`} />
            <div className={`${styles.pulse} ${styles.profileSecurity}`} />
          </div>
          <div className={styles.profileCard}>
            <div className={`${styles.pulse} ${styles.profileSectionTitle}`} />
            <div className={styles.fieldList}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`field-${index}`} className={styles.fieldRow}>
                  <div className={`${styles.pulse} ${styles.fieldLabel}`} />
                  <div className={`${styles.pulse} ${styles.fieldValue}`} />
                </div>
              ))}
            </div>
          </div>
          <div className={styles.profileCard}>
            <div className={`${styles.pulse} ${styles.profileSectionTitle}`} />
            <div className={`${styles.pulse} ${styles.profileStat}`} />
            <div className={`${styles.pulse} ${styles.profileStat}`} />
            <div className={`${styles.pulse} ${styles.profileButton}`} />
          </div>
        </div>
      );
    }

    if (variant === "lecturer") {
      return (
        <>
          <div className={`${styles.pulse} ${styles.hero}`} />
          <div className={`${styles.pulse} ${styles.filterBar}`} />
          <div className={styles.splitLayout}>
            <div className={styles.leftColumn}>
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={`left-${index}`}
                  className={`${styles.pulse} ${styles.listItem}`}
                />
              ))}
            </div>
            <div className={`${styles.pulse} ${styles.detailPanel}`} />
          </div>
        </>
      );
    }

    if (variant === "home") {
      const lecturers = (
        <div className={styles.homeLecturers}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`home-${index}`} className={styles.homeLecturer}>
              <div className={`${styles.pulse} ${styles.homeLecturerPhoto}`} />
              <div className={`${styles.pulse} ${styles.homeLecturerName}`} />
              <div className={`${styles.pulse} ${styles.homeLecturerMeta}`} />
            </div>
          ))}
        </div>
      );

      if (!fullPage) {
        return lecturers;
      }

      return (
        <div className={styles.homeLayout}>
          <div className={styles.homeHero}>
            <div className={styles.homeCopy}>
              <div className={`${styles.pulse} ${styles.homeTitle}`} />
              <div className={`${styles.pulse} ${styles.homeTitle}`} />
              <div className={`${styles.pulse} ${styles.homeTitleShort}`} />
              <div className={`${styles.pulse} ${styles.homeSubtitle}`} />
              <div className={`${styles.pulse} ${styles.homeButton}`} />
            </div>
            <div className={`${styles.pulse} ${styles.homeArt}`} />
          </div>

          <div className={styles.homeStats}>
            <div className={`${styles.pulse} ${styles.homeStatNumber}`} />
            <div className={styles.homeStatCopy}>
              <div className={`${styles.pulse} ${styles.homeStatLine}`} />
              <div className={`${styles.pulse} ${styles.homeStatLineShort}`} />
              <div className={styles.homeAvatars}>
                {Array.from({ length: 9 }).map((_, index) => (
                  <div
                    key={`avatar-${index}`}
                    className={`${styles.pulse} ${styles.homeAvatar}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className={styles.homeTimeline}>
            <div className={`${styles.pulse} ${styles.homeSectionTitle}`} />
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`step-${index}`}
                className={`${styles.pulse} ${styles.homeStep}`}
              />
            ))}
          </div>

          <div className={`${styles.pulse} ${styles.homeSectionTitle}`} />
          {lecturers}
        </div>
      );
    }

    if (variant === "applications") {
      return (
        <>
          <div className={`${styles.pulse} ${styles.filterBar}`} />
          <div className={styles.applicationList}>
            {Array.from({ length: Math.max(cards, 4) }).map((_, index) => (
              <div
                key={`application-${index}`}
                className={`${styles.pulse} ${styles.listItem}`}
              />
            ))}
          </div>
        </>
      );
    }

    if (variant === "tutor") {
      return (
        <div className={styles.tutorPage}>
          <div className={`${styles.pulse} ${styles.tutorTitle}`} />
          <div className={styles.tutorSearchHead}>
            <div className={`${styles.pulse} ${styles.tutorSearchLabel}`} />
            <div className={`${styles.pulse} ${styles.tutorClear}`} />
          </div>
          <div className={`${styles.pulse} ${styles.tutorSearchField}`} />
          <div className={`${styles.pulse} ${styles.tutorFilterLabel}`} />
          <div className={styles.tutorFilters}>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`tutor-filter-${index}`}
                className={`${styles.pulse} ${styles.tutorFilter}`}
              />
            ))}
          </div>
          <div className={`${styles.pulse} ${styles.tutorApply}`} />
          <div className={`${styles.pulse} ${styles.tutorNotice}`} />
          <div className={styles.tutorGrid}>
            {Array.from({ length: Math.max(cards, 6) }).map((_, index) => (
              <div
                key={`tutor-${index}`}
                className={`${styles.pulse} ${styles.cardTall}`}
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <>
        <div className={`${styles.pulse} ${styles.title}`} />
        <div className={`${styles.pulse} ${styles.subtitle}`} />
        <div className={styles.grid}>
          {Array.from({ length: cards }).map((_, index) => (
            <div key={index} className={`${styles.pulse} ${styles.card}`} />
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
    <p className={styles.srOnly} role="status">
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
      className={`${styles.wrapper} ${
        variant === "tutor" ? styles.wrapperTutor : ""
      }`}
      aria-busy="true"
      aria-live="polite"
    >
      <div className={styles.container}>
        {status}
        {body}
      </div>
    </div>
  );
};

export default PageSkeleton;
