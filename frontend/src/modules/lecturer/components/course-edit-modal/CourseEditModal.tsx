"use client";

import React, { useEffect } from "react";
import type {
  LecturerCourseSession,
  LecturerManagedCourse,
} from "@/shared/services/lecturerCourseService";
import styles from "./CourseEditModal.module.css";

const DAY_OPTIONS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

interface CourseEditModalProps {
  isOpen: boolean;
  course: LecturerManagedCourse | null;
  saving: boolean;
  description: string;
  onDescriptionChange: (value: string) => void;
  maxTutors: number;
  onMaxTutorsChange: (value: number) => void;
  maxLabAssistants: number;
  onMaxLabAssistantsChange: (value: number) => void;
  studentsPerClass: number;
  onStudentsPerClassChange: (value: number) => void;
  sessions: LecturerCourseSession[];
  onSessionsChange: (sessions: LecturerCourseSession[]) => void;
  onClose: () => void;
  onSaveDetails: () => void;
  onSaveSchedule: () => void;
  emptyTutorial: (studentsPerClass: number) => LecturerCourseSession;
}

const CourseEditModal: React.FC<CourseEditModalProps> = ({
  isOpen,
  course,
  saving,
  description,
  onDescriptionChange,
  maxTutors,
  onMaxTutorsChange,
  maxLabAssistants,
  onMaxLabAssistantsChange,
  studentsPerClass,
  onStudentsPerClassChange,
  sessions,
  onSessionsChange,
  onClose,
  onSaveDetails,
  onSaveSchedule,
  emptyTutorial,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !course) return null;

  const updateSession = (
    index: number,
    patch: Partial<LecturerCourseSession>
  ) => {
    onSessionsChange(
      sessions.map((session, i) =>
        i === index ? { ...session, ...patch } : session
      )
    );
  };

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-edit-title"
      >
        <header className={styles.header}>
          <div>
            <h2 id="course-edit-title" className={styles.title}>
              {course.courseCode} — {course.courseName}
            </h2>
            <p className={styles.hint}>
              One lecture (2 hours) plus tutorial classes (~{studentsPerClass}{" "}
              students each). Tutors/TAs later pick 1–2 tutorial slots.
            </p>
          </div>
          <button type="button" className={styles.close} onClick={onClose}>
            Done
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <h3>Course content</h3>
              <span
                className={
                  course.isPublished ? styles.badgePublic : styles.badgeDraft
                }
              >
                {course.isPublished ? "Published" : "Draft"}
              </span>
            </div>

            <label className={styles.label} htmlFor="course-description">
              Description for applicants
            </label>
            <textarea
              id="course-description"
              className={styles.textarea}
              rows={6}
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="Rewrite the course description for applicants…"
            />

            <div className={styles.grid3}>
              <label className={styles.field}>
                <span>Max tutors</span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={maxTutors}
                  onChange={(event) =>
                    onMaxTutorsChange(Number(event.target.value))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Max lab assistants</span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={maxLabAssistants}
                  onChange={(event) =>
                    onMaxLabAssistantsChange(Number(event.target.value))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Students / tutorial</span>
                <input
                  type="number"
                  min={5}
                  max={40}
                  value={studentsPerClass}
                  onChange={(event) =>
                    onStudentsPerClassChange(Number(event.target.value))
                  }
                />
              </label>
            </div>

            <button
              type="button"
              className={styles.primary}
              disabled={saving}
              onClick={onSaveDetails}
            >
              {course.isPublished
                ? "Submit content for approval"
                : "Save content & capacity"}
            </button>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <h3>Teaching schedule</h3>
              {course.isPublished ? (
                <span className={styles.badgeWarn}>Changes need approval</span>
              ) : null}
            </div>

            <div className={styles.sessionList}>
              {sessions.map((session, index) => (
                <div
                  key={`${session.sessionType}-${index}`}
                  className={styles.sessionCard}
                >
                  <div className={styles.sessionTop}>
                    <strong>
                      {session.sessionType === "lecture"
                        ? "Lecture (2h)"
                        : "Tutorial"}
                    </strong>
                    {session.sessionType === "tutorial" ? (
                      <button
                        type="button"
                        className={styles.ghost}
                        onClick={() =>
                          onSessionsChange(
                            sessions.filter((_, i) => i !== index)
                          )
                        }
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <div className={styles.grid4}>
                    <label className={styles.field}>
                      <span>Day</span>
                      <select
                        value={session.dayOfWeek}
                        onChange={(event) =>
                          updateSession(index, {
                            dayOfWeek: Number(event.target.value),
                          })
                        }
                      >
                        {DAY_OPTIONS.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span>Start</span>
                      <input
                        type="time"
                        value={session.startTime}
                        onChange={(event) => {
                          const startTime = event.target.value;
                          if (session.sessionType === "lecture") {
                            const [h, m] = startTime.split(":").map(Number);
                            const endMinutes = h * 60 + m + 120;
                            const endH = String(
                              Math.floor(endMinutes / 60) % 24
                            ).padStart(2, "0");
                            const endM = String(endMinutes % 60).padStart(
                              2,
                              "0"
                            );
                            updateSession(index, {
                              startTime,
                              endTime: `${endH}:${endM}`,
                            });
                            return;
                          }
                          updateSession(index, { startTime });
                        }}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>End</span>
                      <input
                        type="time"
                        value={session.endTime}
                        disabled={session.sessionType === "lecture"}
                        onChange={(event) =>
                          updateSession(index, {
                            endTime: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Room</span>
                      <input
                        type="text"
                        value={session.location || ""}
                        onChange={(event) =>
                          updateSession(index, {
                            location: event.target.value,
                          })
                        }
                        placeholder="Optional"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.ghost}
                onClick={() =>
                  onSessionsChange([
                    ...sessions,
                    emptyTutorial(studentsPerClass),
                  ])
                }
              >
                Add tutorial slot
              </button>
              <button
                type="button"
                className={styles.primary}
                disabled={saving}
                onClick={onSaveSchedule}
              >
                {course.isPublished
                  ? "Request schedule change"
                  : "Save schedule"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseEditModal;
