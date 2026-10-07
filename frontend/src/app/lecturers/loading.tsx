import styles from "./lecturers.module.css";
import showcaseStyles from "@/modules/home/components/lecturer-showcase/LecturerShowcase.module.css";

export default function LecturersLoading() {
  return (
    <div className={styles.page} aria-busy="true">
      <p className="sr-only">Loading…</p>
      <header className={styles.stage}>
        <div className={styles.intro}>
          <div className={`${showcaseStyles.skeletonCard} ${styles.skelTitle}`} />
          <div className={`${showcaseStyles.skeletonCard} ${styles.skelLine}`} />
          <div className={`${showcaseStyles.skeletonCard} ${styles.skelSearch}`} />
        </div>
        <div className={styles.portrait}>
          <div className={`${showcaseStyles.skeletonCard} ${styles.skelSit}`} />
        </div>
      </header>
      <div className={showcaseStyles.directoryGrid}>
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className={showcaseStyles.skeletonCard} />
        ))}
      </div>
    </div>
  );
}
