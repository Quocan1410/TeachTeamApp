import { validateNewPassword } from "./passwordRules";

describe("validateNewPassword", () => {
  it("rejects an empty password", () => {
    expect(validateNewPassword("")).toBe("Password is required");
  });

  it("rejects a short password", () => {
    expect(validateNewPassword("Ab1")).toBe(
      "Password must be at least 8 characters long"
    );
  });

  it("rejects a password without mixed case and a number", () => {
    expect(validateNewPassword("password")).toBe(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    );
  });

  it("rejects a password with an emoji", () => {
    expect(validateNewPassword("Password1😊")).toBe(
      "Password cannot contain emojis"
    );
  });

  it("accepts a valid password", () => {
    expect(validateNewPassword("Password123!")).toBeNull();
  });
});
