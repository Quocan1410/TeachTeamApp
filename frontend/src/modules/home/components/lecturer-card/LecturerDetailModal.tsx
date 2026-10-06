import React from "react";
import Image from "next/image";
import Modal from "@/shared/components/common/modal/Modal";
import type { Lecturer, LecturerCourseAssignment } from "@/shared/types/lecturer";
import { lecturerPortraitSrc } from "@/modules/home/components/lecturer-card/LecturerCard";
import styles from "./LecturerDetailModal.module.css";

interface LecturerDetailModalProps {
  lecturer: Lecturer | null;
  imageIndex: number;
  onClose: () => void;
}

function courseRows(lecturer: Lecturer): LecturerCourseAssignment[] {
  if (lecturer.assignedCourses && lecturer.assignedCourses.length > 0) {
    return lecturer.assignedCourses;
  }
  return lecturer.courses
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [courseCode, ...rest] = item.split(" - ");
      return {
        courseCode: courseCode.trim(),
        courseName: rest.join(" - ").trim() || item,
        semester: "",
      };
    });
}

export default function LecturerDetailModal({
  lecturer,
  imageIndex,
  onClose,
}: LecturerDetailModalProps) {
  if (!lecturer) return null;

  const courses = courseRows(lecturer);
  const portrait = lecturer.avatarPath || lecturerPortraitSrc(imageIndex);

  return (
    <Modal
      isOpen={!!lecturer}
      onClose={onClose}
      maxWidth="820px"
      title={lecturer.name}
    >
      <div className={styles.layout}>
        <div className={styles.photo}>
          <Image
            src={portrait}
            alt={lecturer.name}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className={styles.portrait}
          />
        </div>
        <div className={styles.body}>
          <p className={styles.rank}>{lecturer.title}</p>
          <h3 className={styles.name}>{lecturer.name}</h3>
          <p className={styles.meta}>
            <span>{lecturer.yearsExperience ?? "—"} years teaching</span>
            <span className={styles.dot} aria-hidden="true" />
            <span>{courses.length} courses</span>
          </p>
          <p className={styles.bio}>{lecturer.bio}</p>
          <section className={styles.courses}>
            <h4 className={styles.sectionLabel}>Courses this semester</h4>
            <ul className={styles.courseGrid}>
              {courses.map((course) => (
                <li key={`${course.courseCode}-${course.courseName}`}>
                  <span className={styles.courseCode}>{course.courseCode}</span>
                  <span className={styles.courseName}>{course.courseName}</span>
                </li>
              ))}
            </ul>
          </section>
          <p className={styles.email}>
            <span className={styles.emailLabel}>Email</span>
            <span className={styles.emailValue}>{lecturer.contact}</span>
          </p>
        </div>
      </div>
    </Modal>
  );
}
