import multer from "multer";
import path from "path";
import {
    AVATAR_UPLOAD_DIR,
    ensureAvatarUploadDir,
} from "../utils/avatarUtils";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MIME_EXTENSION: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/pjpeg": ".jpg",
    "image/png": ".png",
    "image/x-png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
    "image/bmp": ".bmp",
    "image/x-ms-bmp": ".bmp",
};
const NAME_EXTENSION: Record<string, string> = {
    ".jpg": ".jpg",
    ".jpeg": ".jpg",
    ".png": ".png",
    ".webp": ".webp",
    ".gif": ".gif",
    ".avif": ".avif",
    ".bmp": ".bmp",
};

function resolvedAvatarExtension(file: { mimetype: string; originalname: string }): string | null {
    const fromMime = MIME_EXTENSION[file.mimetype];
    const fromName = NAME_EXTENSION[path.extname(file.originalname).toLowerCase()];
    if (fromMime) return fromMime;
    if ((file.mimetype === "" || file.mimetype === "application/octet-stream") && fromName) {
        return fromName;
    }
    return null;
}

ensureAvatarUploadDir();

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        ensureAvatarUploadDir();
        cb(null, AVATAR_UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const userId = (req as { user?: { userId?: string } }).user?.userId ?? "unknown";
        const safeExt = resolvedAvatarExtension(file) ?? ".jpg";
        cb(null, `user-${userId}-${Date.now()}${safeExt}`);
    },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
    if (!resolvedAvatarExtension(file)) {
        cb(new Error("Use a JPG, PNG, WebP, GIF, AVIF, or BMP image"));
        return;
    }
    cb(null, true);
};

export const avatarUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
});
