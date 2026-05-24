import React from "react";
import Image from "next/image";
import styles from "./LecturerCard.module.css";
import type { Lecturer } from "@/shared/types/lecturer"; // Assuming a Lecturer type will be defined

interface LecturerCardProps {
  lecturer: Lecturer;
  onOpenModal: (lecturerId: string) => void;
  // index is passed to get a unique image, ideally image path would be part of lecturer data
  imageIndex: number;
}

function lecturerAvatarIndex(contact: string, fallbackIndex: number): number {
  const emailHash = contact
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (emailHash % 4) + 1 || (fallbackIndex % 4) + 1;
}

const LecturerCard: React.FC<LecturerCardProps> = ({
  lecturer,
  onOpenModal,
  imageIndex,
}) => {
  const avatarIndex = lecturerAvatarIndex(lecturer.contact, imageIndex);

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
            src={`/lecturers/lecturer-${avatarIndex}.jpg`}
            alt={lecturer.name}
            width={200}
            height={200}
            className={styles.lecturerImage}
            loading={imageIndex < 2 ? "eager" : "lazy"} // Prioritize first 2 images
          />
          <div className={styles.lecturerDecoration}></div>
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
