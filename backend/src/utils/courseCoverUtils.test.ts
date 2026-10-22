import fs from "fs";
import path from "path";
import {
    COURSE_COVER_UPLOAD_DIR,
    buildCourseCoverPublicPath,
    deleteCourseCoverFileIfExists,
    ensureCourseCoverUploadDir,
} from "./courseCoverUtils";

describe("courseCoverUtils", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("builds the public cover path", () => {
        expect(buildCourseCoverPublicPath("cover.png")).toBe(
            "/uploads/course-covers/cover.png"
        );
    });

    it("creates the upload directory when it is missing", () => {
        jest.spyOn(fs, "existsSync").mockReturnValue(false);
        const mkdir = jest
            .spyOn(fs, "mkdirSync")
            .mockImplementation(() => undefined);
        ensureCourseCoverUploadDir();
        expect(mkdir).toHaveBeenCalledWith(COURSE_COVER_UPLOAD_DIR, {
            recursive: true,
        });
    });

    it("leaves an existing upload directory alone", () => {
        jest.spyOn(fs, "existsSync").mockReturnValue(true);
        const mkdir = jest
            .spyOn(fs, "mkdirSync")
            .mockImplementation(() => undefined);
        ensureCourseCoverUploadDir();
        expect(mkdir).not.toHaveBeenCalled();
    });

    it("ignores missing or non-cover urls", () => {
        const unlink = jest
            .spyOn(fs, "unlinkSync")
            .mockImplementation(() => undefined);
        deleteCourseCoverFileIfExists(null);
        deleteCourseCoverFileIfExists("");
        deleteCourseCoverFileIfExists("/uploads/avatars/a.png");
        expect(unlink).not.toHaveBeenCalled();
    });

    it("deletes a cover file that exists", () => {
        jest.spyOn(fs, "existsSync").mockReturnValue(true);
        const unlink = jest
            .spyOn(fs, "unlinkSync")
            .mockImplementation(() => undefined);
        deleteCourseCoverFileIfExists("/uploads/course-covers/cover.png");
        expect(unlink).toHaveBeenCalledWith(
            path.join(COURSE_COVER_UPLOAD_DIR, "cover.png")
        );
    });

    it("skips delete when the cover file is already gone", () => {
        jest.spyOn(fs, "existsSync").mockReturnValue(false);
        const unlink = jest
            .spyOn(fs, "unlinkSync")
            .mockImplementation(() => undefined);
        deleteCourseCoverFileIfExists("/uploads/course-covers/missing.png");
        expect(unlink).not.toHaveBeenCalled();
    });
});
