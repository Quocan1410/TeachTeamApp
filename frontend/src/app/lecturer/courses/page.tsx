"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";
import { useLecturerAuth } from "@/modules/lecturer/hooks/useLecturerAuth";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import {
  LecturerCourseService,
  LecturerCourseSession,
  LecturerManagedCourse,
  TimetableEntry,
} from "@/shared/services/lecturerCourseService";
import Toast from "@/shared/components/common/toast/toast";
import styles from "./LecturerCoursesPage.module.css";

const DAY_OPTIONS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

function emptyLecture(): LecturerCourseSession {
  return {
    sessionType: "lecture",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "11:00",
    location: "",
    capacity: null,
  };
}

function emptyTutorial(studentsPerClass: number): LecturerCourseSession {
  return {
    sessionType: "tutorial",
    dayOfWeek: 2,
    startTime: "14:00",
    endTime: "15:00",
    location: "",
    capacity: studentsPerClass,
  };
}

export default function LecturerCoursesPage() {
  const { user, isLoading: authLoading } = useAuth();
  useLecturerAuth();
  const [courses, setCourses] = useState<LecturerManagedCourse[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [description, setDescription] = useState("");
  const [maxTutors, setMaxTutors] = useState(5);
  const [maxLabAssistants, setMaxLabAssistants] = useState(3);
  const [studentsPerClass, setStudentsPerClass] = useState(15);
  const [sessions, setSessions] = useState<LecturerCourseSession[]>([
    emptyLecture(),
  ]);

  const selected = useMemo(
    () => courses.find((course) => course.id === selectedId) || null,
    [courses, selectedId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    const [courseResult, timetableResult] = await Promise.all([
      LecturerCourseService.listAssigned(),
      LecturerCourseService.getTimetable(),
    ]);
    if (courseResult.success && courseResult.data) {
      setCourses(courseResult.data.courses);
      setSelectedId((current) =>
        current && courseResult.data!.courses.some((row) => row.id === current)
          ? current
          : courseResult.data!.courses[0]?.id || ""
      );
    } else {
      setToast({
        message: courseResult.message || "Failed to load courses",
        type: "error",
      });
    }
    if (timetableResult.success && timetableResult.data) {
      setTimetable(timetableResult.data.entries);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading || !user || user.userType !== "lecturer") return;
    void load();
  }, [authLoading, user, load]);

  useEffect(() => {
    if (!selected) return;
    setDescription(selected.description || "");
    setMaxTutors(selected.maxTutors);
    setMaxLabAssistants(selected.maxLabAssistants);
    setStudentsPerClass(selected.studentsPerClass);
    setSessions(
      selected.sessions.length > 0
        ? selected.sessions.map((session) => ({
            ...session,
            startTime: session.startTime.slice(0, 5),
            endTime: session.endTime.slice(0, 5),
            location: session.location || "",
          }))
        : [emptyLecture(), emptyTutorial(selected.studentsPerClass)]
    );
  }, [selected]);

  const saveDetails = async () => {
    if (!selected) return;
    setSaving(true);
    const result = await LecturerCourseService.updateCourse(selected.id, {
      description,
      maxTutors,
      maxLabAssistants,
      studentsPerClass,
    });
    setSaving(false);
    setToast({
      message:
        result.message ||
        (result.data?.requiresApproval
          ? "Submitted for approval"
          : "Saved"),
      type: result.success ? "success" : "error",
    });
    if (result.success) await load();
  };

  const saveSchedule = async () => {
    if (!selected) return;
    setSaving(true);
    const result = await LecturerCourseService.saveSessions(
      selected.id,
      sessions
    );
    setSaving(false);
    setToast({
      message:
        result.message ||
        (result.data?.requiresApproval
          ? "Schedule submitted for approval"
          : "Schedule saved"),
      type: result.success ? "success" : "error",
    });
    if (result.success) await load();
  };

  const updateSession = (
    index: number,
    patch: Partial<LecturerCourseSession>
  ) => {
    setSessions((current) =>
      current.map((session, i) =>
        i === index ? { ...session, ...patch } : session
      )
    );
  };

  if (authLoading || loading) {
    return <PageSkeleton variant="lecturer" />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>My courses</h1>
          <p className={styles.lead}>
            Shape content and teaching times for your assigned courses. Draft
            freely; published courses need admin approval for changes.
          </p>
        </header>

        {courses.length === 0 ? (
          <div className={styles.empty}>
            No courses assigned yet. Contact an administrator.
          </div>
        ) : (
          <div className={styles.layout}>
            <aside className={styles.side}>
              <p className={styles.sideLabel}>Assigned courses</p>
              <ul className={styles.courseList}>
                {courses.map((course) => (
                  <li key={course.id}>
                    <button
                      type="button"
                      className={`${styles.courseItem} ${
                        course.id === selectedId ? styles.courseItemActive : ""
                      }`}
                      onClick={() => setSelectedId(course.id)}
                    >
                      <span className={styles.courseCode}>
                        {course.courseCode}
                      </span>
                      <span className={styles.courseName}>
                        {course.courseName}
                      </span>
                      <span className={styles.courseMeta}>
                        {course.semester}
                        {course.isPublished ? " · Public" : " · Draft"}
                        {course.pendingRequests.length > 0
                          ? ` · ${course.pendingRequests.length} pending`
                          : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <section className={styles.main}>
              {selected && (
                <>
                  <div className={styles.panel}>
                    <div className={styles.panelHead}>
                      <h2>
                        {selected.courseCode} — {selected.courseName}
                      </h2>
                      <span
                        className={
                          selected.isPublished
                            ? styles.badgePublic
                            : styles.badgeDraft
                        }
                      >
                        {selected.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className={styles.hint}>
                      One lecture (2 hours) plus tutorial classes (~
                      {studentsPerClass} students each). Tutors/TAs later pick
                      1–2 tutorial slots.
                    </p>

                    <label className={styles.label} htmlFor="course-description">
                      Course content
                    </label>
                    <textarea
                      id="course-description"
                      className={styles.textarea}
                      rows={6}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
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
                            setMaxTutors(Number(event.target.value))
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
                            setMaxLabAssistants(Number(event.target.value))
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
                            setStudentsPerClass(Number(event.target.value))
                          }
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      className={styles.primary}
                      disabled={saving}
                      onClick={() => void saveDetails()}
                    >
                      {selected.isPublished
                        ? "Submit content for approval"
                        : "Save content & capacity"}
                    </button>
                  </div>

                  <div className={styles.panel}>
                    <div className={styles.panelHead}>
                      <h2>Teaching schedule</h2>
                      {selected.isPublished && (
                        <span className={styles.badgeWarn}>
                          Changes need approval
                        </span>
                      )}
                    </div>

                    <div className={styles.sessionList}>
                      {sessions.map((session, index) => (
                        <div key={`${session.sessionType}-${index}`} className={styles.sessionCard}>
                          <div className={styles.sessionTop}>
                            <strong>
                              {session.sessionType === "lecture"
                                ? "Lecture (2h)"
                                : "Tutorial"}
                            </strong>
                            {session.sessionType === "tutorial" && (
                              <button
                                type="button"
                                className={styles.ghost}
                                onClick={() =>
                                  setSessions((current) =>
                                    current.filter((_, i) => i !== index)
                                  )
                                }
                              >
                                Remove
                              </button>
                            )}
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
                                    const [h, m] = startTime
                                      .split(":")
                                      .map(Number);
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
                          setSessions((current) => [
                            ...current,
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
                        onClick={() => void saveSchedule()}
                      >
                        {selected.isPublished
                          ? "Request schedule change"
                          : "Save schedule"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        <section className={styles.timetableSection}>
          <h2 className={styles.timetableTitle}>Timetable</h2>
          <p className={styles.lead}>
            Your teaching slots across every assigned course.
          </p>
          {timetable.length === 0 ? (
            <div className={styles.empty}>No sessions scheduled yet.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Course</th>
                    <th>Type</th>
                    <th>Room</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {timetable.map((entry) => (
                    <tr key={`${entry.courseCode}-${entry.dayOfWeek}-${entry.startTime}-${entry.sessionType}`}>
                      <td>{entry.dayLabel}</td>
                      <td>
                        {entry.startTime}–{entry.endTime}
                      </td>
                      <td>
                        {entry.courseCode}
                        <span className={styles.tableSub}>
                          {entry.courseName}
                        </span>
                      </td>
                      <td>{entry.sessionType}</td>
                      <td>{entry.location || "—"}</td>
                      <td>{entry.isPublished ? "Public" : "Draft"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          visible={!!toast}
          onClose={() => setToast(null)}
          variant="toast"
          position="bottom-left"
          autoClose
          autoCloseDelay={4000}
        />
      )}
    </div>
  );
}
