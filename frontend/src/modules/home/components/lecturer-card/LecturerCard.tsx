import React from "react";
import Image from "next/image";
import styles from "./LecturerCard.module.css";
import type { Lecturer } from "@/shared/types/lecturer"; // Assuming a Lecturer type will be defined

interface LecturerCardProps {
  lecturer: Lecturer;
  onOpenModal: (lecturerId: string) => void;
  imageIndex: number;
}

export function lecturerPortraitSrc(imageIndex: number): string {
  const slot = imageIndex >= 0 ? imageIndex % 12 : 0;
  return `/lecturers/lecturer-${slot + 1}.jpg`;
}

const LecturerCard: React.FC<LecturerCardProps> = ({
  lecturer,
  onOpenModal,
  imageIndex,
}) => {

  const handleCardClick = () => {
    onOpenModal(lecturer.id);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenModal(lecturer.id);
  };

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
        <p className={styles.lecturerSpecialization}>
          {lecturer.specialization}
        </p>
      </div>
      <button className={styles.moreInfoBtn} onClick={handleButtonClick}>
        More Information
      </button>
    </div>
  );
};

export default React.memo(LecturerCard);
