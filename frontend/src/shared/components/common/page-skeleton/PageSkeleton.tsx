import React from "react";
import styles from "./PageSkeleton.module.css";

interface PageSkeletonProps {
  cards?: number;
  variant?: "default" | "lecturer" | "tutor" | "profile" | "auth" | "home";
  /** Full viewport shell for route-level loading; false for in-page sections */
  fullPage?: boolean;
}

const PageSkeleton: React.FC<PageSkeletonProps> = ({
  cards = 6,
  variant = "default",
  fullPage = true,
}) => {
  const renderBody = () => {
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
        <>
          <div className={styles.profileHeader}>
            <div className={`${styles.pulse} ${styles.avatar}`} />
            <div className={styles.profileTextWrap}>
              <div className={`${styles.pulse} ${styles.profileName}`} />
              <div className={`${styles.pulse} ${styles.profileLine}`} />
              <div className={`${styles.pulse} ${styles.profileLineShort}`} />
            </div>
          </div>
          <div className={styles.grid}>
            {Array.from({ length: Math.max(cards, 4) }).map((_, index) => (
              <div key={index} className={`${styles.pulse} ${styles.card}`} />
            ))}
          </div>
        </>
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
      return (
        <div className={styles.homeGrid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`home-${index}`} className={`${styles.pulse} ${styles.homeCard}`} />
          ))}
        </div>
      );
    }

    if (variant === "tutor") {
      return (
        <>
          <div className={`${styles.pulse} ${styles.hero}`} />
          <div className={`${styles.pulse} ${styles.filterBar}`} />
          <div className={styles.grid}>
            {Array.from({ length: Math.max(cards, 6) }).map((_, index) => (
              <div
                key={`tutor-${index}`}
                className={`${styles.pulse} ${styles.cardTall}`}
              />
            ))}
          </div>
        </>
      );
    }

    return (
      <>
        <div className={`${styles.pulse} ${styles.hero}`} />
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

  const body = renderBody();

  if (!fullPage) {
    return (
      <div aria-busy="true" aria-live="polite">
        {body}
      </div>
    );
  }

  return (
    <div className={styles.wrapper} aria-busy="true" aria-live="polite">
      <div className={styles.container}>{body}</div>
    </div>
  );
};

export default PageSkeleton;
