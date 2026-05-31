import React from "react";
import styles from "./LecturerShowcase.module.css";
import LecturerCard from "../lecturer-card/LecturerCard";
import SectionTitle from "../SectionTitle/SectionTitle";
import type { Lecturer } from "@/shared/types/lecturer";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";

interface LecturerShowcaseProps {
  lecturers: Lecturer[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onOpenLecturerModal: (lecturerId: string) => void;
}

const LecturerShowcase: React.FC<LecturerShowcaseProps> = ({
  lecturers,
  isLoading = false,
  error = null,
  onRetry,
  onOpenLecturerModal,
}) => {
  const displayedLecturers = lecturers.slice(0, 4);

  return (
    <section
      className="py-24"
      id="lecturers"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <div className="container mx-auto">
        <div className="max-w-6xl mx-auto">
          <SectionTitle
            title="Meet Our Lecturers"
            subtitle="Meet four of our lecturers and the courses they support on TeachTeam."
          />

          {isLoading && <PageSkeleton variant="home" fullPage={false} />}

          {!isLoading && error && (
            <div className={styles.statusBlock}>
              <p className={styles.statusMessage}>{error}</p>
              {onRetry && (
                <button
                  type="button"
                  className={styles.retryBtn}
                  onClick={onRetry}
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {!isLoading && !error && displayedLecturers.length === 0 && (
            <p className={styles.statusMessage}>
              Default lecturers are being set up. Restart the backend API, or
              run <code>npm run db:reset</code> in the backend folder if this
              message persists.
            </p>
          )}

          {!isLoading && !error && displayedLecturers.length > 0 && (
            <div className={styles.lecturerGrid}>
              {displayedLecturers.map((lecturer, index) => (
                <LecturerCard
                  key={lecturer.id}
                  lecturer={lecturer}
                  onOpenModal={onOpenLecturerModal}
                  imageIndex={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default React.memo(LecturerShowcase);
