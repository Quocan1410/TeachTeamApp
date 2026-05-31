/** Canonical single system admin — must match admin-backend seed. */
export const getAdminEmail = (): string =>
    (process.env.ADMIN_EMAIL || "admin@admin.com").trim().toLowerCase();

export const isCanonicalAdminEmail = (email: string): boolean =>
    email.trim().toLowerCase() === getAdminEmail();
