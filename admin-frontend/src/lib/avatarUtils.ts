export const getApiOrigin = (): string => {
    const endpoint =
        process.env.NEXT_PUBLIC_API_ENDPOINT ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000/api";

    return endpoint.replace(/\/api\/?$/, "");
};

export const resolveAvatarUrl = (
    avatarUrl?: string | null
): string | null => {
    if (!avatarUrl) {
        return null;
    }

    if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
        return avatarUrl;
    }

    return `${getApiOrigin()}${avatarUrl}`;
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
