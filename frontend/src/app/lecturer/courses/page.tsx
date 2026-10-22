"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";
import { useLecturerAuth } from "@/modules/lecturer/hooks/useLecturerAuth";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import {
  LecturerCourseService,
  LecturerCourseSession,
  LecturerManagedCourse,
} from "@/shared/services/lecturerCourseService";
import Toast from "@/shared/components/common/toast/toast";
import CoursesHeroSection from "@/modules/lecturer/components/hero-section/CoursesHeroSection";
import CoursesSearchFilters, {
  type LecturerCourseFilter,
  type LecturerCourseSort,
} from "@/modules/lecturer/components/courses-search-filters/CoursesSearchFilters";
import ManagedCourseCard from "@/modules/lecturer/components/managed-course-card/ManagedCourseCard";
import CourseEditModal from "@/modules/lecturer/components/course-edit-modal/CourseEditModal";
import CourseCoverCropModal from "@/modules/lecturer/components/course-cover-crop-modal/CourseCoverCropModal";
import PaginationBar from "@/shared/components/common/pagination-bar/PaginationBar";
import { isAllowedAvatarFile } from "@/shared/utils/avatarUtils";
import styles from "./LecturerCoursesPage.module.css";

const COURSE_PAGE_SIZE = 6;

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
  const [selectedId, setSelectedId] = useState<string>("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<LecturerCourseFilter>("all");
  const [sortBy, setSortBy] = useState<LecturerCourseSort>("name");
  const [coursePage, setCoursePage] = useState(1);
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
  const [coverCourseId, setCoverCourseId] = useState<string | null>(null);
  const [coverCropSrc, setCoverCropSrc] = useState<string | null>(null);
  const [coverSaving, setCoverSaving] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => courses.find((course) => course.id === selectedId) || null,
    [courses, selectedId]
  );

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = courses.filter((course) => {
      if (filter === "published" && !course.isPublished) return false;
      if (filter === "draft" && course.isPublished) return false;
      if (filter === "pending" && course.pendingRequests.length === 0) {
        return false;
      }
      if (!q) return true;
      return (
        course.courseCode.toLowerCase().includes(q) ||
        course.courseName.toLowerCase().includes(q) ||
        course.semester.toLowerCase().includes(q) ||
        (course.description || "").toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "code") {
        return a.courseCode.localeCompare(b.courseCode);
      }
      if (sortBy === "sessions") {
        return b.sessions.length - a.sessions.length;
      }
      return a.courseName.localeCompare(b.courseName);
    });
  }, [courses, filter, searchQuery, sortBy]);

  const courseTotalPages = Math.max(
    1,
    Math.ceil(filteredCourses.length / COURSE_PAGE_SIZE)
  );

  const paginatedCourses = filteredCourses.slice(
    (coursePage - 1) * COURSE_PAGE_SIZE,
    coursePage * COURSE_PAGE_SIZE
  );

  const clearFilters = () => {
    setSearchQuery("");
    setFilter("all");
    setSortBy("name");
  };

  const load = useCallback(async () => {
    setLoading(true);
    const courseResult = await LecturerCourseService.listAssigned();
    if (courseResult.success && courseResult.data) {
      setCourses(courseResult.data.courses);
      setSelectedId((current) =>
        current && courseResult.data!.courses.some((row) => row.id === current)
          ? current
          : ""
      );
    } else {
      setToast({
        message: courseResult.message || "Failed to load courses",
        type: "error",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading || !user || user.userType !== "lecturer") return;
    void load();
  }, [authLoading, user, load]);

  useEffect(() => {
    setCoursePage(1);
  }, [searchQuery, filter, sortBy]);

  useEffect(() => {
    if (coursePage > courseTotalPages) {
      setCoursePage(courseTotalPages);
    }
  }, [coursePage, courseTotalPages]);

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

  const openEditor = (courseId: string) => {
    setSelectedId(courseId);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setSelectedId("");
  };

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

  const closeCoverCrop = () => {
    if (coverCropSrc) URL.revokeObjectURL(coverCropSrc);
    setCoverCropSrc(null);
    setCoverCourseId(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const openCoverPicker = (courseId: string) => {
    setCoverCourseId(courseId);
    coverInputRef.current?.click();
  };

  const onCoverFileChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !coverCourseId) return;
    if (!isAllowedAvatarFile(file)) {
      setToast({
        message: "Use a JPG, PNG, WebP, GIF, AVIF, or BMP image",
        type: "error",
      });
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: "Cover image must be 2MB or smaller", type: "error" });
      event.target.value = "";
      return;
    }
    if (coverCropSrc) URL.revokeObjectURL(coverCropSrc);
    setCoverCropSrc(URL.createObjectURL(file));
  };

  const saveCover = async (file: File) => {
    if (!coverCourseId) return;
    setCoverSaving(true);
    const result = await LecturerCourseService.uploadCover(coverCourseId, file);
    setCoverSaving(false);
    if (!result.success || !result.data) {
      setToast({
        message: result.message || "Failed to update cover",
        type: "error",
      });
      return;
    }
    setCourses((current) =>
      current.map((course) =>
        course.id === coverCourseId
          ? { ...course, coverImageUrl: result.data!.coverImageUrl }
          : course
      )
    );
    setToast({ message: "Course cover updated", type: "success" });
    closeCoverCrop();
  };

  const removeCover = async (courseId: string) => {
    const result = await LecturerCourseService.deleteCover(courseId);
    if (!result.success) {
      setToast({
        message: result.message || "Failed to remove cover",
        type: "error",
      });
      return;
    }
    setCourses((current) =>
      current.map((course) =>
        course.id === courseId ? { ...course, coverImageUrl: null } : course
      )
    );
    setToast({ message: "Course cover removed", type: "success" });
  };

  if (authLoading || loading) {
    return <PageSkeleton variant="lecturer" />;
  }

  return (
    <>
      <CoursesHeroSection>
        {courses.length > 0 ? (
          <CoursesSearchFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            status={filter}
            onStatusChange={setFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            onClear={clearFilters}
          />
        ) : null}
      </CoursesHeroSection>

      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp"
        className={styles.hiddenFile}
        onChange={onCoverFileChosen}
      />

      <CourseCoverCropModal
        imageSrc={coverCropSrc}
        isOpen={!!coverCropSrc}
        isSaving={coverSaving}
        onCancel={closeCoverCrop}
        onConfirm={saveCover}
      />

      <CourseEditModal
        isOpen={editorOpen}
        course={selected}
        saving={saving}
        description={description}
        onDescriptionChange={setDescription}
        maxTutors={maxTutors}
        onMaxTutorsChange={setMaxTutors}
        maxLabAssistants={maxLabAssistants}
        onMaxLabAssistantsChange={setMaxLabAssistants}
        studentsPerClass={studentsPerClass}
        onStudentsPerClassChange={setStudentsPerClass}
        sessions={sessions}
        onSessionsChange={setSessions}
        onClose={closeEditor}
        onSaveDetails={() => void saveDetails()}
        onSaveSchedule={() => void saveSchedule()}
        emptyTutorial={emptyTutorial}
      />

      <main className={styles.page} id="lecturer-courses-list">
        {toast ? (
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
        ) : null}

        <div className={styles.results}>
          {courses.length === 0 ? (
            <div className={styles.empty} role="status">
              <Image
                src="/mascot/mascot-2.png"
                alt=""
                width={160}
                height={160}
                className={styles.emptyMascot}
              />
              <p className={styles.emptyTitle}>No courses assigned yet</p>
              <p className={styles.emptySubtitle}>
                Contact an administrator to get courses on your workspace.
              </p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className={styles.empty} role="status">
              <Image
                src="/mascot/mascot-3.png"
                alt=""
                width={148}
                height={148}
                className={styles.emptyMascot}
              />
              <p className={styles.emptyTitle}>No courses match</p>
              <p className={styles.emptySubtitle}>
                Try another search, or clear the filters to see everything
                again.
              </p>
              <button
                type="button"
                className={styles.emptyClear}
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className={styles.courseGrid}>
                {paginatedCourses.map((course) => (
                  <ManagedCourseCard
                    key={course.id}
                    course={course}
                    onManage={openEditor}
                    onChangeCover={openCoverPicker}
                    onRemoveCover={(id) => void removeCover(id)}
                  />
                ))}
              </div>
              <PaginationBar
                page={coursePage}
                pageSize={COURSE_PAGE_SIZE}
                totalCount={filteredCourses.length}
                totalPages={courseTotalPages}
                onPageChange={setCoursePage}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}
