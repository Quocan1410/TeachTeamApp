export const hasCustomAvatar = (avatarUrl?: string | null): boolean => {
    return !!avatarUrl && avatarUrl.startsWith("/uploads/avatars/");
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
