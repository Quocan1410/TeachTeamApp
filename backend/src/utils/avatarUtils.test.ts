import fs from "fs";
import os from "os";
import path from "path";
import {
  AVATAR_UPLOAD_DIR,
  buildAvatarPublicPath,
  deleteAvatarFileIfExists,
  ensureAvatarUploadDir,
  getAvatarMimeType,
  reconcileOrphanAvatarFiles,
  resolveAvatarFilePath,
} from "./avatarUtils";

describe("avatar path helpers", () => {
  it("builds the public avatar path", () => {
    expect(buildAvatarPublicPath("user-1-2.png")).toBe(
      "/uploads/avatars/user-1-2.png"
    );
  });

  it("maps file extensions to mime types", () => {
    expect(getAvatarMimeType("a.png")).toBe("image/png");
    expect(getAvatarMimeType("a.webp")).toBe("image/webp");
    expect(getAvatarMimeType("a.gif")).toBe("image/gif");
    expect(getAvatarMimeType("a.avif")).toBe("image/avif");
    expect(getAvatarMimeType("a.bmp")).toBe("image/bmp");
    expect(getAvatarMimeType("a.jpg")).toBe("image/jpeg");
  });

  it("rejects avatar urls outside the uploads folder", () => {
    expect(resolveAvatarFilePath("/etc/passwd")).toBeNull();
    expect(resolveAvatarFilePath(null)).toBeNull();
  });
});

describe("avatar filesystem helpers", () => {
  const originalCwd = process.cwd();
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "avatar-utils-"));
    process.chdir(tempRoot);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("creates the upload directory", () => {
    ensureAvatarUploadDir();
    expect(fs.existsSync(AVATAR_UPLOAD_DIR)).toBe(true);
  });

  it("deletes an existing avatar file", () => {
    ensureAvatarUploadDir();
    const filename = "user-11111111-1111-4111-8111-111111111111-1.png";
    const filePath = path.join(AVATAR_UPLOAD_DIR, filename);
    fs.writeFileSync(filePath, "x");
    deleteAvatarFileIfExists(buildAvatarPublicPath(filename));
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it("resolves an existing avatar file path", () => {
    ensureAvatarUploadDir();
    const filename = "user-11111111-1111-4111-8111-111111111111-1.png";
    fs.writeFileSync(path.join(AVATAR_UPLOAD_DIR, filename), "x");
    expect(resolveAvatarFilePath(buildAvatarPublicPath(filename))).toBe(
      path.join(AVATAR_UPLOAD_DIR, filename)
    );
  });

  it("links orphan avatar files to users without an avatarUrl", async () => {
    ensureAvatarUploadDir();
    const userId = "11111111-1111-4111-8111-111111111111";
    const filename = `user-${userId}-1.png`;
    fs.writeFileSync(path.join(AVATAR_UPLOAD_DIR, filename), "x");
    const user = { id: userId, avatarUrl: null as string | null };
    const repo = {
      findOne: jest.fn(async () => user),
      save: jest.fn(async (saved) => saved),
    };

    const linked = await reconcileOrphanAvatarFiles(repo);
    expect(linked).toBe(1);
    expect(user.avatarUrl).toBe(buildAvatarPublicPath(filename));
    expect(repo.save).toHaveBeenCalled();
  });
});
