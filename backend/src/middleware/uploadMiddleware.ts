import multer from "multer";
import path from "path";
import {
    AVATAR_UPLOAD_DIR,
    ensureAvatarUploadDir,
} from "../utils/avatarUtils";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

ensureAvatarUploadDir();

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        ensureAvatarUploadDir();
        cb(null, AVATAR_UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const userId = (req as { user?: { userId?: number } }).user?.userId ?? "unknown";
        const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
        const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
            ? ext === ".jpeg"
                ? ".jpg"
                : ext
            : ".jpg";
        cb(null, `user-${userId}-${Date.now()}${safeExt}`);
    },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
        return;
    }
    cb(null, true);
};

export const avatarUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
});
