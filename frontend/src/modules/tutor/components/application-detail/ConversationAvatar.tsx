"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { hasCustomAvatar } from "@/shared/utils/avatarUtils";
import { useProtectedAvatar } from "@/shared/hooks/useProtectedAvatar";
import { useUserAvatarImage } from "@/shared/hooks/useUserAvatarImage";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { formatPersonDisplayName } from "@/shared/utils/personDisplayName";
import { getPersonInitials, type AvatarPerson } from "./conversationUtils";
import styles from "./ConversationPanel.module.css";
interface ConversationAvatarProps {
  person: AvatarPerson;
  variant?: "you" | "lecturer" | "default";
  className?: string;
  size?: number;
}

const ConversationAvatar: React.FC<ConversationAvatarProps> = ({
  person,
  variant = "default",
  className,
  size = 38,
}) => {
  const { user: currentUser } = useAuth();
  const displayName = formatPersonDisplayName(person, person.email || "User");
  const custom = hasCustomAvatar(person.avatarUrl);
  const isSelf =
    person.userId != null &&
    currentUser?.id != null &&
    person.userId === currentUser.id;

  const myAvatarUrl = useProtectedAvatar(
    custom && isSelf,
    isSelf ? person.avatarUrl : null
  );
  const otherAvatarUrl = useUserAvatarImage(
    custom && !isSelf ? person.userId : undefined,
    person.avatarUrl
  );
  const imageSrc = custom ? (isSelf ? myAvatarUrl : otherAvatarUrl) : null;

  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [imageSrc]);

  const variantClass =
    variant === "you"
      ? styles.avatarYou
      : variant === "lecturer"
        ? styles.avatarLecturer
        : "";

  const initials = getPersonInitials(person);
  const showImage = Boolean(imageSrc) && !loadFailed;

  return (
    <span
      className={`${styles.avatar} ${variantClass} ${className ?? ""}`}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
      aria-hidden={showImage}
      role={showImage ? undefined : "img"}
      aria-label={showImage ? undefined : displayName || person.email || "User"}
    >
      {showImage ? (
        <Image
          src={imageSrc!}
          alt=""
          width={size}
          height={size}
          className={styles.avatarImage}
          unoptimized={custom}
          onError={() => setLoadFailed(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
};

export default ConversationAvatar;
