import { User, UserType } from "../types/user";
import { stripHonorificFromDisplayName } from "./personDisplayName";

/** Avatar images are served via authenticated API, not public /uploads. */
export const hasCustomAvatar = (avatarUrl?: string | null): boolean => {
  return !!avatarUrl && avatarUrl.startsWith("/uploads/avatars/");
};

/** Cache-bust key derived from stored avatar path (filename changes on each upload). */
export const getAvatarCacheBuster = (
  avatarUrl?: string | null
): string | undefined => {
  if (!avatarUrl) return undefined;
  const filename = avatarUrl.split("/").pop()?.trim();
  return filename || undefined;
};

export const getDefaultAvatarPath = (
  email: string,
  userType?: UserType | string
): string => {
  const emailHash = email
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  if (userType === UserType.LECTURER || userType === "lecturer") {
    return `/lecturers/lecturer-${(emailHash % 4) + 1}.jpg`;
  }

  return `/avatars/avatar-${(emailHash % 12) + 1}.jpg`;
};

export const getUserAvatarSrc = (
  user: Pick<User, "email" | "userType" | "avatarUrl">
): string => {
  return getDefaultAvatarPath(user.email, user.userType);
};

export const getUserInitials = (
  firstName?: string,
  lastName?: string,
  email?: string,
  fullName?: string
): string => {
  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";

  if (first && last) {
    return `${first[0]}${last[0]}`.toUpperCase();
  }

  if (first) {
    const parts = first.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return first.slice(0, 2).toUpperCase();
  }

  if (fullName) {
    const stripped = stripHonorificFromDisplayName(fullName);
    const parts = stripped.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "?";
};
