import { User, UserType } from "../types/user";

/** Avatar images are served via authenticated API, not public /uploads. */
export const hasCustomAvatar = (avatarUrl?: string | null): boolean => {
  return !!avatarUrl && avatarUrl.startsWith("/uploads/avatars/");
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
  if (hasCustomAvatar(user.avatarUrl)) {
    return getDefaultAvatarPath(user.email, user.userType);
  }
  return getDefaultAvatarPath(user.email, user.userType);
};

export const getUserInitials = (
  firstName?: string,
  lastName?: string,
  email?: string
): string => {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? "?";
};
