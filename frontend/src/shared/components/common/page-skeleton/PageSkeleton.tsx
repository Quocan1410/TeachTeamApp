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
        <div className={styles.pageSkeleton__profileShell}>
          <aside className={styles.pageSkeleton__profileSide} aria-hidden="true">
            <div className={styles.pageSkeleton__profileIdentity}>
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileSideAvatar}`} />
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileSideName}`} />
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileSideRole}`} />
            </div>
            <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileSideGroup}`} />
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`nav-${index}`}
                className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileNavItem} ${
                  index === 0 ? styles.pageSkeleton__profileNavItemActive : ""
                }`}
              />
            ))}
          </aside>

          <div className={styles.pageSkeleton__profileMain}>
            <header className={styles.pageSkeleton__profileHeader}>
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileTitle}`} />
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileMeta}`} />
            </header>

            <div className={styles.pageSkeleton__profileEditBlock}>
              <div className={styles.pageSkeleton__profilePictureRow}>
                <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profilePictureAvatar}`} />
                <div className={styles.pageSkeleton__profilePictureCopy}>
                  <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileBlockTitle}`} />
                  <div className={styles.pageSkeleton__profilePictureActions}>
                    <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileActionBtn}`} />
                    <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileActionBtnGhost}`} />
                  </div>
                  <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileHint}`} />
                </div>
              </div>
            </div>

            <div className={styles.pageSkeleton__profileEditBlock}>
              <div className={styles.pageSkeleton__profileNameRow}>
                <div className={styles.pageSkeleton__profileField}>
                  <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileFieldLabel}`} />
                  <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileInput}`} />
                </div>
                <div className={styles.pageSkeleton__profileField}>
                  <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileFieldLabel}`} />
                  <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileInput}`} />
                </div>
              </div>
            </div>

            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`block-${index}`} className={styles.pageSkeleton__profileEditBlock}>
                <div className={styles.pageSkeleton__profileField}>
                  <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__profileFieldLabel}`} />
                  <div
                    className={`${styles.pageSkeleton__pulse} ${
                      index === 1 || index === 2
                        ? styles.pageSkeleton__profileInputTall
                        : styles.pageSkeleton__profileInput
                    }`}
                  />
                </div>
              </div>
            ))}
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
        <div className={styles.pageSkeleton__appsPage}>
          <section className={styles.pageSkeleton__appsHero} aria-hidden="true">
            <div className={styles.pageSkeleton__appsHeroInner}>
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__appsHeroTitle}`} />
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__appsHeroSubtitle}`} />
              <div className={styles.pageSkeleton__appsTips}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`apps-tip-${index}`}
                    className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__appsTip}`}
                  />
                ))}
              </div>
              <div className={styles.pageSkeleton__appsStats}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`apps-stat-${index}`} className={styles.pageSkeleton__appsStat}>
                    <div
                      className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__appsStatValue}`}
                    />
                    <div
                      className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__appsStatLabel}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className={styles.pageSkeleton__appsMain}>
            <div className={styles.pageSkeleton__appsToolbar}>
              <div className={styles.pageSkeleton__appsFilters}>
                <div
                  className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__appsSearch}`}
                />
                <div
                  className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__appsSelect}`}
                />
                <div
                  className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__appsSelect}`}
                />
              </div>
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__appsToggle}`} />
              <div className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__appsHint}`} />
            </div>

            <div className={styles.pageSkeleton__appsGrid}>
              {Array.from({ length: Math.max(cards, 6) }).map((_, index) => (
                <div
                  key={`application-${index}`}
                  className={styles.pageSkeleton__appsCard}
                >
                  <div className={styles.pageSkeleton__appsCardTop}>
                    <div
                      className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__appsCardEyebrow}`}
                    />
                    <div
                      className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__appsCardBadge}`}
                    />
                  </div>
                  <div
                    className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__appsCardTitle}`}
                  />
                  <div
                    className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__appsCardLine}`}
                  />
                  <div
                    className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__appsCardLineShort}`}
                  />
                  <div className={styles.pageSkeleton__appsCardBottom}>
                    <div
                      className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__appsCardRole}`}
                    />
                    <div
                      className={`${styles.pageSkeleton__pulse} ${styles.pageSkeleton__appsCardDate}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
      } ${variant === "profile" ? styles.pageSkeleton__wrapperProfile : ""} ${
        variant === "applications" ? styles.pageSkeleton__wrapperApps : ""
      }`}
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className={`${styles.pageSkeleton__container} ${
          variant === "profile" ? styles.pageSkeleton__containerProfile : ""
        } ${variant === "applications" ? styles.pageSkeleton__containerApps : ""}`}
      >
        {status}
        {body}
      </div>
    </div>
  );
};

export default PageSkeleton;
