"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AcademicCapIcon,
  BeakerIcon,
  CalendarDaysIcon,
  CheckIcon,
  ClockIcon,
  LockClosedIcon,
  LockOpenIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import {
  PublicService,
  type PublicOpening,
} from "@/shared/services/publicService";
import Modal from "@/shared/components/common/modal/Modal";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import buttonStyles from "@/shared/components/common/Button/Button.module.css";
import CoursesSkeleton from "./courses-skeleton";
import styles from "./courses.module.css";

const PAGE_SIZE = 9;

type RoleFilter = "all" | "tutor" | "lab";
type StatusFilter = "all" | "open" | "closed";

function placesLeft(opening: PublicOpening): number {
  if (!opening.isApplicationOpen) return 0;
  return opening.tutorPlacesLeft + opening.labAssistantPlacesLeft;
}

function openRoles(opening: PublicOpening): string[] {
  if (!opening.isApplicationOpen) return [];
  return [
    opening.tutorPlacesLeft > 0 ? "Tutor" : "",
    opening.labAssistantPlacesLeft > 0 ? "Lab assistant" : "",
  ].filter((role) => role.length > 0);
}

function deadlineLabel(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function closesSoon(opening: PublicOpening): boolean {
  if (placesLeft(opening) <= 0 || !opening.applicationDeadline) return false;
  const date = new Date(opening.applicationDeadline);
  if (Number.isNaN(date.getTime())) return false;
  const days = (date.getTime() - Date.now()) / 86_400_000;
  return days >= 0 && days <= 21;
}

function mascotLine(
  role: RoleFilter,
  status: StatusFilter,
  semester: string | null,
  soon: boolean,
): string {
  if (semester) return `I'll show you ${semester}.`;
  if (soon) return "These close soon. Want a look?";
  if (status === "closed") return "These ones are already closed.";
  if (role === "tutor") return "Tutor roles? Right here.";
  if (role === "lab") return "Lab assistant? I've got those.";
  if (status === "open") return "These are still open!";
  return "Hi! Try a term, or a course name.";
}

export default function CoursesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [openings, setOpenings] = useState<PublicOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PublicOpening | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [semesterFilter, setSemesterFilter] = useState<string | null>(null);
  const [soonOnly, setSoonOnly] = useState(false);
  const [page, setPage] = useState(1);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 280);
  const isLecturer = user?.userType === "lecturer";

  const loadOpenings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOpenings(await PublicService.getOpenings());
    } catch {
      setError("Courses could not be loaded. Try again.");
      setOpenings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOpenings();
  }, [loadOpenings]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, roleFilter, statusFilter, semesterFilter, soonOnly]);

  const filtered = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    return openings
      .filter((opening) => {
        const open = placesLeft(opening) > 0;
        if (statusFilter === "open" && !open) return false;
        if (statusFilter === "closed" && open) return false;
        if (semesterFilter && opening.semester !== semesterFilter) return false;
        if (soonOnly && !closesSoon(opening)) return false;
        if (
          roleFilter === "tutor" &&
          opening.maxTutors <= 0 &&
          opening.tutorPlacesLeft <= 0
        ) {
          return false;
        }
        if (
          roleFilter === "lab" &&
          opening.maxLabAssistants <= 0 &&
          opening.labAssistantPlacesLeft <= 0
        ) {
          return false;
        }
        if (!query) return true;
        const haystack = `${opening.courseCode} ${opening.courseName} ${opening.lecturers.join(" ")}`.toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => {
        const aOpen = placesLeft(a) > 0;
        const bOpen = placesLeft(b) > 0;
        if (aOpen !== bOpen) return aOpen ? -1 : 1;
        return a.courseCode.localeCompare(b.courseCode);
      });
  }, [openings, debouncedSearchQuery, roleFilter, statusFilter, semesterFilter, soonOnly]);

  const semesters = useMemo(() => {
    return [...new Set(openings.map((opening) => opening.semester).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    );
  }, [openings]);

  const hasSoon = useMemo(() => openings.some(closesSoon), [openings]);

  const pickStatus = (value: StatusFilter) => {
    setStatusFilter(value);
    setSoonOnly(false);
  };

  const pickOpenNow = () => {
    if (statusFilter === "open" && !soonOnly) {
      setStatusFilter("all");
      return;
    }
    setSoonOnly(false);
    setStatusFilter("open");
  };

  const pickSoon = () => {
    if (soonOnly) {
      setSoonOnly(false);
      setStatusFilter("all");
      return;
    }
    setSoonOnly(true);
    setStatusFilter("open");
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
    setSemesterFilter(null);
    setSoonOnly(false);
  };

  const apply = (opening: PublicOpening) => {
    if (isLecturer || placesLeft(opening) <= 0) return;
    if (isAuthenticated && user?.userType === "candidate") {
      router.push("/tutor");
      return;
    }
    setSelected(opening);
  };

  if (loading) {
    return <CoursesSkeleton />;
  }

  return (
    <div className={styles.courses__page}>
      <header className={styles.courses__hero}>
        <h1 className={styles.courses__srOnly}>Courses</h1>
        <div className={styles.courses__mascotWell}>
          <Image
            src="/mascot/mascot-1.png"
            alt=""
            width={292}
            height={341}
            className={styles.courses__mascot}
          />
        </div>
        <div className={styles.courses__searchColumn}>
          <p className={styles.courses__bubble} aria-live="polite">
            {mascotLine(roleFilter, statusFilter, semesterFilter, soonOnly)}
          </p>
          <form
            className={styles.courses__searchPanel}
            onSubmit={(event) => event.preventDefault()}
          >
            <MagnifyingGlassIcon className={styles.courses__searchIcon} aria-hidden="true" />
            <input
              className={styles.courses__search}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Course or lecturer"
              aria-label="Search by course or lecturer"
            />
            <button type="submit" className={styles.courses__searchButton}>
              Search
            </button>
          </form>
          <div className={styles.courses__hints} role="group" aria-label="Suggestions">
            <button
              type="button"
              className={statusFilter === "open" && !soonOnly ? styles.courses__hintOn : styles.courses__hint}
              aria-pressed={statusFilter === "open" && !soonOnly}
              onClick={pickOpenNow}
            >
              Open now
            </button>
            {hasSoon && (
              <button
                type="button"
                className={soonOnly ? styles.courses__hintOn : styles.courses__hint}
                aria-pressed={soonOnly}
                onClick={pickSoon}
              >
                Closing soon
              </button>
            )}
            {semesters.map((semester) => (
              <button
                key={semester}
                type="button"
                className={semesterFilter === semester ? styles.courses__hintOn : styles.courses__hint}
                aria-pressed={semesterFilter === semester}
                onClick={() =>
                  setSemesterFilter(semesterFilter === semester ? null : semester)
                }
              >
                {semester}
              </button>
            ))}
            {roleFilter !== "all" && (
              <button
                type="button"
                className={styles.courses__hintOn}
                onClick={() => setRoleFilter("all")}
              >
                {roleFilter === "tutor" ? "Tutor" : "Lab assistant"}
                <span aria-hidden="true"> ×</span>
              </button>
            )}
            {statusFilter === "closed" && (
              <button
                type="button"
                className={styles.courses__hintOn}
                onClick={() => pickStatus("all")}
              >
                Closed
                <span aria-hidden="true"> ×</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div>
          <p className={styles.courses__note}>{error}</p>
          <button
            type="button"
            className={`${buttonStyles.button__btn} ${buttonStyles.button__btnOutline} ${styles.courses__retry}`}
            onClick={loadOpenings}
          >
            Try again
          </button>
        </div>
      )}

      {!error && (
        <div className={styles.courses__workspace}>
          <aside className={styles.courses__filters} aria-label="Filters">
            <p className={styles.courses__filterHeading}>Filters</p>
            <fieldset className={styles.courses__filterGroup}>
              <legend className={styles.courses__filterLegend}>Role</legend>
              {(
                [
                  ["all", "All", Squares2X2Icon],
                  ["tutor", "Tutor", AcademicCapIcon],
                  ["lab", "Lab assistant", BeakerIcon],
                ] as const
              ).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    roleFilter === value ? styles.courses__filterOn : styles.courses__filterOff
                  }
                  aria-pressed={roleFilter === value}
                  onClick={() => setRoleFilter(value)}
                >
                  <span className={styles.courses__filterMark}>
                    <Icon aria-hidden="true" />
                  </span>
                  <span className={styles.courses__filterLabel}>{label}</span>
                  {roleFilter === value && (
                    <CheckIcon className={styles.courses__filterTick} aria-hidden="true" />
                  )}
                </button>
              ))}
            </fieldset>
            <fieldset className={styles.courses__filterGroup}>
              <legend className={styles.courses__filterLegend}>Status</legend>
              {(
                [
                  ["all", "All", Squares2X2Icon],
                  ["open", "Open", LockOpenIcon],
                  ["closed", "Closed", LockClosedIcon],
                ] as const
              ).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    statusFilter === value ? styles.courses__filterOn : styles.courses__filterOff
                  }
                  aria-pressed={statusFilter === value}
                  onClick={() => pickStatus(value)}
                >
                  <span className={styles.courses__filterMark}>
                    <Icon aria-hidden="true" />
                  </span>
                  <span className={styles.courses__filterLabel}>{label}</span>
                  {statusFilter === value && (
                    <CheckIcon className={styles.courses__filterTick} aria-hidden="true" />
                  )}
                </button>
              ))}
            </fieldset>
          </aside>
          <div className={styles.results}>
      {filtered.length === 0 && (
        <div className={styles.courses__empty}>
          <Image
            src="/mascot/mascot-1.png"
            alt=""
            width={292}
            height={341}
            className={styles.courses__emptyMascot}
          />
          <div>
            <p className={styles.courses__emptyTitle}>No courses match that search.</p>
            <p className={styles.courses__emptyText}>
              Try another course or lecturer, or clear the filters.
            </p>
            <button type="button" className={styles.courses__emptyClear} onClick={clearFilters}>
              Clear search
            </button>
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          <ul className={styles.courses__list}>
            {visible.map((opening) => {
              const open = placesLeft(opening) > 0;
              const roles = openRoles(opening);
              const closes = deadlineLabel(opening.applicationDeadline);
              const lecturer =
                opening.lecturers.length > 0
                  ? opening.lecturers.join(", ")
                  : "Lecturer not assigned";

              return (
                <li
                  key={opening.courseId}
                  className={open ? styles.courses__card : styles.courses__cardClosed}
                >
                  <div className={styles.courses__face}>
                    <div>
                      <p className={styles.courses__code}>{opening.courseCode}</p>
                      <h2 className={styles.courses__name}>{opening.courseName}</h2>
                      <ul className={styles.courses__facts}>
                        <li>
                          <span className={`${styles.courses__factMark} ${styles.courses__factUser}`}>
                            <UserIcon aria-hidden="true" />
                          </span>
                          <span className={styles.courses__factText}>{lecturer}</span>
                        </li>
                        {opening.semester && (
                          <li>
                            <span className={`${styles.courses__factMark} ${styles.courses__factTerm}`}>
                              <CalendarDaysIcon aria-hidden="true" />
                            </span>
                            <span className={styles.courses__factText}>{opening.semester}</span>
                          </li>
                        )}
                        <li>
                          <span className={`${styles.courses__factMark} ${styles.courses__factTime}`}>
                            <ClockIcon aria-hidden="true" />
                          </span>
                          <span className={styles.courses__factText}>
                            {open && closes ? `Closes ${closes}` : "Closed"}
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className={styles.courses__footer}>
                      <div className={styles.courses__chips}>
                        {open ? (
                          roles.map((role) => (
                            <span
                              key={role}
                              className={role === "Tutor" ? styles.courses__chipTutor : styles.courses__chipLab}
                            >
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className={styles.courses__chipMuted}>Closed</span>
                        )}
                      </div>
                      {open && !isLecturer && (
                        <button
                          type="button"
                          className={styles.courses__apply}
                          onClick={() => apply(opening)}
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {totalPages > 1 && (
            <div className={styles.courses__pager}>
              <button
                type="button"
                className={styles.courses__pagerButton}
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span className={styles.courses__pagerStatus}>
                {page} of {totalPages}
              </span>
              <button
                type="button"
                className={styles.courses__pagerButton}
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
          </div>
        </div>
      )}

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={
          selected ? `Sign in to apply for ${selected.courseCode}` : "Sign in to apply"
        }
        maxWidth="40rem"
      >
        <div className={styles.courses__dialog}>
          {selected && (
            <div className={styles.courses__dialogCourse}>
              <Image
                src="/mascot/mascot-1.png"
                alt=""
                width={292}
                height={341}
                className={styles.courses__dialogMascot}
              />
              <div className={styles.courses__dialogCourseBody}>
                <p className={styles.courses__dialogKicker}>Applying for</p>
                <p className={styles.courses__dialogCode}>{selected.courseCode}</p>
                <p className={styles.courses__dialogCourseName}>{selected.courseName}</p>
                <ul className={styles.courses__dialogFacts}>
                  <li>
                    <span className={`${styles.courses__factMark} ${styles.courses__factUser}`}>
                      <UserIcon aria-hidden="true" />
                    </span>
                    <span>
                      {selected.lecturers.length > 0
                        ? selected.lecturers.join(", ")
                        : "Lecturer not assigned"}
                    </span>
                  </li>
                  {selected.semester && (
                    <li>
                      <span className={`${styles.courses__factMark} ${styles.courses__factTerm}`}>
                        <CalendarDaysIcon aria-hidden="true" />
                      </span>
                      <span>{selected.semester}</span>
                    </li>
                  )}
                  <li>
                    <span className={`${styles.courses__factMark} ${styles.courses__factTime}`}>
                      <ClockIcon aria-hidden="true" />
                    </span>
                    <span>
                      {deadlineLabel(selected.applicationDeadline)
                        ? `Closes ${deadlineLabel(selected.applicationDeadline)}`
                        : "Open"}
                    </span>
                  </li>
                </ul>
                <div className={styles.courses__dialogRoles}>
                  {openRoles(selected).map((role) => (
                    <span
                      key={role}
                      className={role === "Tutor" ? styles.courses__chipTutor : styles.courses__chipLab}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className={styles.courses__dialogAsk}>
            <h2 className={styles.courses__dialogTitle}>Sign in to apply</h2>
            <p className={styles.courses__dialogText}>
              Sign in, then choose tutor or lab assistant for this course.
            </p>
            <div className={styles.courses__dialogActions}>
              <Link
                href="/signin"
                className={`${buttonStyles.button__btn} ${buttonStyles.button__btnPrimary}`}
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
