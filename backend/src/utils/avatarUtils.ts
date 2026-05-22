import fs from "fs";
import path from "path";

export const AVATAR_UPLOAD_DIR = path.resolve(
    __dirname,
    "../../uploads/avatars"
);

export const buildAvatarPublicPath = (filename: string): string =>
    `/uploads/avatars/${filename}`;

export const deleteAvatarFileIfExists = (avatarUrl?: string | null): void => {
    if (!avatarUrl || !avatarUrl.startsWith("/uploads/avatars/")) {
        return;
    }

    const filename = path.basename(avatarUrl);
    const filePath = path.join(AVATAR_UPLOAD_DIR, filename);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

export const ensureAvatarUploadDir = (): void => {
    if (!fs.existsSync(AVATAR_UPLOAD_DIR)) {
        fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
    }
};
