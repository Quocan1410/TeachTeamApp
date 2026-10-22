"use client";

import React from "react";
import { CameraIcon } from "@heroicons/react/24/outline";
import type { LecturerManagedCourse } from "@/shared/services/lecturerCourseService";
import styles from "./ManagedCourseCard.module.css";

function snippet(text: string, max = 110): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "No course description yet — add content for applicants.";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}…`;
}

interface ManagedCourseCardProps {
  course: LecturerManagedCourse;
  onManage: (courseId: string) => void;
  onChangeCover: (courseId: string) => void;
  onRemoveCover: (courseId: string) => void;
}

const ManagedCourseCard: React.FC<ManagedCourseCardProps> = ({
  course,
  onManage,
  onChangeCover,
  onRemoveCover,
}) => {
  const hasPending = course.pendingRequests.length > 0;
  const statusLabel = hasPending
    ? "Pending"
    : course.isPublished
      ? "Published"
      : "Draft";
  const badgeClass = hasPending
    ? styles.badgePending
    : course.isPublished
      ? styles.badgePublic
      : "";

  const meta = [
    `${course.sessions.length} session${course.sessions.length === 1 ? "" : "s"}`,
    course.applicationDeadline
      ? `Deadline ${new Date(course.applicationDeadline).toLocaleDateString()}`
      : `${course.maxTutors} tutors`,
  ].join(" · ");

  return (
    <article className={styles.card}>
      <div className={styles.main}>
        <p className={styles.eyebrow}>
          <span className={styles.code}>{course.courseCode}</span>
          <span className={styles.dot} aria-hidden>
            ·
          </span>
          <span>{course.semester}</span>
        </p>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{course.courseName}</h3>
          <span className={`${styles.badge} ${badgeClass}`}>{statusLabel}</span>
        </div>
        <p className={styles.description}>{snippet(course.description || "")}</p>
      </div>

      <div className={styles.footer}>
        <p className={styles.meta}>{meta}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={() => onChangeCover(course.id)}
            aria-label={`Change cover for ${course.courseCode}`}
          >
            <CameraIcon className={styles.cameraIcon} aria-hidden />
            Photo
          </button>
          {course.coverImageUrl ? (
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={() => onRemoveCover(course.id)}
            >
              Remove
            </button>
          ) : null}
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => onManage(course.id)}
          >
            Manage
          </button>
        </div>
      </div>
    </article>
  );
};

export default ManagedCourseCard;
