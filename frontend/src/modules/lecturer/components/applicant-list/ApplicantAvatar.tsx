"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  getUserInitials,
  hasCustomAvatar,
} from "@/shared/utils/avatarUtils";
import { useUserAvatarImage } from "@/shared/hooks/useUserAvatarImage";
import styles from "./applicant-list.module.css";

interface ApplicantAvatarProps {
  userId: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
}

const ApplicantAvatar: React.FC<ApplicantAvatarProps> = ({
  userId,
  email,
  fullName,
  firstName,
  lastName,
  avatarUrl,
}) => {
  const custom = hasCustomAvatar(avatarUrl);
  const candidateId = Number.parseInt(userId, 10);
  const imageUrl = useUserAvatarImage(
    custom && Number.isFinite(candidateId) ? candidateId : undefined,
    avatarUrl
  );
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [imageUrl, avatarUrl]);

  const initials = getUserInitials(firstName, lastName, email, fullName);
  const showImage = custom && Boolean(imageUrl) && !loadFailed;

  return (
    <div
      className={`${styles.applicantAvatar} ${
        showImage ? styles.applicantAvatarHasImage : ""
      }`}
    >
      {showImage ? (
        <Image
          src={imageUrl!}
          alt=""
          width={56}
          height={56}
          className={styles.applicantAvatarPhoto}
          unoptimized
          onError={() => setLoadFailed(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
};

export default ApplicantAvatar;
