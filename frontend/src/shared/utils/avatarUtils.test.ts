import {
  AVATAR_MAX_BYTES,
  getAvatarCacheBuster,
  getDefaultAvatarPath,
  getUserAvatarSrc,
  getUserInitials,
  hasCustomAvatar,
  isAllowedAvatarFile,
} from "./avatarUtils";
import { UserType } from "@/shared/types/user";

describe("isAllowedAvatarFile", () => {
  it("accepts known mime types", () => {
    expect(isAllowedAvatarFile({ type: "image/png", name: "a.bin" })).toBe(true);
  });

  it("accepts extension when mime is empty or octet-stream", () => {
    expect(isAllowedAvatarFile({ type: "", name: "face.webp" })).toBe(true);
    expect(
      isAllowedAvatarFile({ type: "application/octet-stream", name: "face.bmp" })
    ).toBe(true);
  });

  it("rejects other mime types", () => {
    expect(isAllowedAvatarFile({ type: "text/plain", name: "a.png" })).toBe(
      false
    );
  });
});

describe("avatar helpers", () => {
  it("detects custom avatar urls", () => {
    expect(hasCustomAvatar("/uploads/avatars/user-1.png")).toBe(true);
    expect(hasCustomAvatar("/avatars/avatar-1.jpg")).toBe(false);
  });

  it("reads a cache buster from the filename", () => {
    expect(getAvatarCacheBuster("/uploads/avatars/user-1-9.png")).toBe(
      "user-1-9.png"
    );
    expect(getAvatarCacheBuster(null)).toBeUndefined();
  });

  it("picks default lecturer and candidate avatars", () => {
    expect(getDefaultAvatarPath("a@b.com", UserType.LECTURER)).toMatch(
      /\/lecturers\/lecturer-\d\.jpg/
    );
    expect(getDefaultAvatarPath("a@b.com", "candidate")).toMatch(
      /\/avatars\/avatar-\d+\.jpg/
    );
    expect(
      getUserAvatarSrc({
        email: "a@b.com",
        userType: UserType.CANDIDATE,
        avatarUrl: null,
      })
    ).toMatch(/\/avatars\//);
  });

  it("builds initials from name parts", () => {
    expect(getUserInitials("Eden", "Coverage")).toBe("EC");
    expect(getUserInitials("Eden Ann")).toBe("EA");
    expect(getUserInitials(undefined, undefined, "ab@c.com")).toBe("AB");
    expect(getUserInitials()).toBe("?");
  });

  it("exposes the 2MB limit", () => {
    expect(AVATAR_MAX_BYTES).toBe(2 * 1024 * 1024);
  });
});
