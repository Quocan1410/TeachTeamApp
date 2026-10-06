import React from "react";
import styles from "./LecturerShowcase.module.css";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";
import LecturerCard from "@/modules/home/components/lecturer-card/LecturerCard";
import SectionTitle from "@/modules/home/components/section-title/SectionTitle";
import type { Lecturer } from "@/shared/types/lecturer";

interface LecturerShowcaseProps {
  lecturers: Lecturer[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onOpenLecturerModal: (lecturerId: string) => void;
  title?: string;
  subtitle?: string;
  limit?: number;
}

const LecturerShowcase: React.FC<LecturerShowcaseProps> = ({
  lecturers,
  isLoading = false,
  error = null,
  onRetry,
  onOpenLecturerModal,
  title = "Meet Our Lecturers",
  subtitle = "Lecturers assigned to courses, and the subjects they teach.",
  limit = 4,
}) => {
  const displayedLecturers = lecturers.slice(0, limit);

  return (
    <section
      className="py-24"
      id="lecturers"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <div className="container mx-auto">
        <div className="max-w-6xl mx-auto">
          <SectionTitle title={title} subtitle={subtitle} />

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
              No lecturers are available yet.
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
