import React from "react";
import Image from "next/image";
import styles from "./LecturerCard.module.css";
import type { Lecturer } from "@/shared/types/lecturer"; // Assuming a Lecturer type will be defined

interface LecturerCardProps {
  lecturer: Lecturer;
  onOpenModal: (lecturerId: string) => void;
  imageIndex: number;
  variant?: "home" | "directory";
  highlightTerms?: string[];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0 || text.length === 0) return text;
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "ig");
  const nodes: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    nodes.push(
      <mark key={`${index}-${match[0]}`} className={styles.hit}>
        {match[0]}
      </mark>
    );
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length > 0 ? <>{nodes}</> : text;
}

export function lecturerPortraitSrc(imageIndex: number): string {
  const slot = imageIndex >= 0 ? imageIndex % 12 : 0;
  return `/lecturers/lecturer-${slot + 1}.jpg`;
}

const LecturerCard: React.FC<LecturerCardProps> = ({
  lecturer,
  onOpenModal,
  imageIndex,
  variant = "home",
  highlightTerms = [],
}) => {

  const handleCardClick = () => {
    onOpenModal(lecturer.id);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenModal(lecturer.id);
  };

  const tiltCard = (event: React.MouseEvent<HTMLDivElement>) => {
    const shell = event.currentTarget;
    const bounds = shell.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    shell.style.setProperty("--ry", `${(x * 14).toFixed(2)}deg`);
    shell.style.setProperty("--rx", `${(-y * 12).toFixed(2)}deg`);
  };

  const resetTilt = (event: React.MouseEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty("--ry", "0deg");
    event.currentTarget.style.setProperty("--rx", "0deg");
  };

  if (variant === "directory") {
    const courses = (lecturer.assignedCourses ?? []).slice(0, 3);
    return (
      <div className={styles.directoryStage}>
      <div
        className={styles.directoryShell}
        onMouseMove={tiltCard}
        onMouseLeave={resetTilt}
      >
        <button type="button" className={styles.directory} onClick={handleCardClick}>
          <span className={styles.ornament} aria-hidden="true">
            <span className={styles.gem} />
            <span className={styles.dotBlue} />
            <span className={styles.dotGreen} />
          </span>
          <span className={styles.directoryTop}>
            <span className={styles.directoryPhoto}>
              <Image
                src={lecturer.avatarPath || lecturerPortraitSrc(imageIndex)}
                alt=""
                width={112}
                height={112}
                className={styles.lecturerImage}
              />
            </span>
            <span className={styles.directoryCopy}>
              <span className={styles.directoryName}>
                <Highlighted text={lecturer.name} terms={highlightTerms} />
              </span>
              <span className={styles.directoryRole}>
                <Highlighted text={lecturer.title} terms={highlightTerms} />
              </span>
            </span>
          </span>
          {courses.length > 0 && (
            <span className={styles.directoryCourses}>
              {courses.map((course) => {
                const codeHit = highlightTerms.some((term) =>
                  course.courseCode.toLowerCase().includes(term)
                );
                const nameHit = highlightTerms.some((term) =>
                  course.courseName.toLowerCase().includes(term)
                );
                return (
                  <span key={`${course.courseCode}-${course.semester}`} className={styles.code}>
                    {nameHit && !codeHit ? (
                      <mark className={styles.hit}>{course.courseCode}</mark>
                    ) : (
                      <Highlighted text={course.courseCode} terms={highlightTerms} />
                    )}
                  </span>
                );
              })}
            </span>
          )}
        </button>
      </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.lecturerCard} lecturer${imageIndex + 1}`}
      onClick={handleCardClick}
    >
      <div>
        <div className={styles.lecturerImageContainer}>
          <Image
            src={lecturer.avatarPath || lecturerPortraitSrc(imageIndex)}
            alt={lecturer.name}
            width={200}
            height={200}
            className={styles.lecturerImage}
            loading={imageIndex < 2 ? "eager" : "lazy"}
          />
        </div>
        <h3 className={styles.lecturerName}>{lecturer.name}</h3>
        <p className={styles.lecturerTitle}>{lecturer.title}</p>
        <p className={styles.lecturerSpecialization}>{lecturer.specialization}</p>
      </div>
      <button className={styles.moreInfoBtn} onClick={handleButtonClick}>
        More Information
      </button>
    </div>
  );
};

export default React.memo(LecturerCard);
