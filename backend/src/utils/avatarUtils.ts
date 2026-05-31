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

export const resolveAvatarFilePath = (
    avatarUrl?: string | null
): string | null => {
    if (!avatarUrl || !avatarUrl.startsWith("/uploads/avatars/")) {
        return null;
    }

    const filename = path.basename(avatarUrl);
    if (!/^user-\d+-\d+\.(jpg|jpeg|png|webp)$/i.test(filename)) {
        return null;
    }

    const filePath = path.join(AVATAR_UPLOAD_DIR, filename);
    return fs.existsSync(filePath) ? filePath : null;
};

export const getAvatarMimeType = (filePath: string): string => {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case ".png":
            return "image/png";
        case ".webp":
            return "image/webp";
        case ".jpg":
        case ".jpeg":
        default:
            return "image/jpeg";
    }
};

/** Link uploaded files to users when avatarUrl was cleared (e.g. after db:reset). */
export const reconcileOrphanAvatarFiles = async (
    userRepository: { findOne: (opts: { where: { id: number } }) => Promise<{ id: number; avatarUrl: string | null } | null>; save: (user: { id: number; avatarUrl: string | null }) => Promise<unknown> }
): Promise<number> => {
    if (!fs.existsSync(AVATAR_UPLOAD_DIR)) {
        return 0;
    }

    let linked = 0;
    const files = fs.readdirSync(AVATAR_UPLOAD_DIR);

    for (const file of files) {
        const match = /^user-(\d+)-\d+\.(jpg|jpeg|png|webp)$/i.exec(file);
        if (!match) {
            continue;
        }

        const userId = parseInt(match[1], 10);
        const user = await userRepository.findOne({ where: { id: userId } });
        if (!user || user.avatarUrl) {
            continue;
        }

        user.avatarUrl = buildAvatarPublicPath(file);
        await userRepository.save(user);
        linked += 1;
    }

    return linked;
};
