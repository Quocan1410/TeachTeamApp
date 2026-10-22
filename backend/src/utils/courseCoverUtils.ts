import fs from "fs";
import path from "path";
import { UPLOADS_DIR } from "./avatarUtils";

export const COURSE_COVER_UPLOAD_DIR = path.join(UPLOADS_DIR, "course-covers");

export const buildCourseCoverPublicPath = (filename: string): string =>
    `/uploads/course-covers/${filename}`;

export const ensureCourseCoverUploadDir = (): void => {
    if (!fs.existsSync(COURSE_COVER_UPLOAD_DIR)) {
        fs.mkdirSync(COURSE_COVER_UPLOAD_DIR, { recursive: true });
    }
};

export const deleteCourseCoverFileIfExists = (
    coverImageUrl?: string | null
): void => {
    if (!coverImageUrl || !coverImageUrl.startsWith("/uploads/course-covers/")) {
        return;
    }

    const filename = path.basename(coverImageUrl);
    const filePath = path.join(COURSE_COVER_UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};
