import { UserType } from "../entities/User";
import {
  getUserTypeFromEmail,
  validateApplicationData,
  validateChangePasswordData,
  validateEmailDomain,
  validateSigninData,
  validateSignupData,
} from "./validation";

describe("getUserTypeFromEmail", () => {
  it("maps school domains to roles", () => {
    expect(getUserTypeFromEmail("a@candidate.edu.au")).toBe(UserType.CANDIDATE);
    expect(getUserTypeFromEmail("b@LECTURER.EDU.AU")).toBe(UserType.LECTURER);
    expect(getUserTypeFromEmail("c@gmail.com")).toBeNull();
  });
});

describe("validateEmailDomain", () => {
  it("accepts either school domain when no role is expected", () => {
    expect(validateEmailDomain("a@candidate.edu.au").isValid).toBe(true);
    expect(validateEmailDomain("b@lecturer.edu.au").isValid).toBe(true);
    expect(validateEmailDomain("c@gmail.com").isValid).toBe(false);
  });

  it("checks the domain for a specific role", () => {
    expect(
      validateEmailDomain("a@candidate.edu.au", UserType.CANDIDATE)
    ).toEqual({ isValid: true, expectedDomain: "@candidate.edu.au" });
    expect(
      validateEmailDomain("a@candidate.edu.au", UserType.LECTURER)
    ).toEqual({ isValid: false, expectedDomain: "@lecturer.edu.au" });
  });
});

describe("validateSignupData", () => {
  const valid = {
    email: "eden@candidate.edu.au",
    password: "Password123!",
    firstName: "Eden",
    lastName: "Coverage",
    honorific: "Mr.",
    userType: UserType.CANDIDATE,
  };

  it("accepts a complete candidate signup", () => {
    expect(validateSignupData(valid)).toEqual({ isValid: true, errors: {} });
  });

  it("requires a title and school email", () => {
    const result = validateSignupData({
      ...valid,
      honorific: "",
      email: "eden@gmail.com",
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.honorific).toBe("Please select a title");
    expect(result.errors.email).toMatch(/@candidate.edu.au/);
  });

  it("rejects a role that does not match the email domain", () => {
    const result = validateSignupData({
      ...valid,
      userType: UserType.LECTURER,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toMatch(/does not match selected user type/);
  });
});

describe("validateChangePasswordData", () => {
  it("requires the current password and matching confirmation", () => {
    const result = validateChangePasswordData({
      currentPassword: "",
      newPassword: "Password123!x",
      confirmPassword: "other",
    });
    expect(result.errors.currentPassword).toBe("Current password is required");
    expect(result.errors.confirmPassword).toBe("Passwords do not match");
  });

  it("accepts a valid password change payload", () => {
    expect(
      validateChangePasswordData({
        currentPassword: "Password123!",
        newPassword: "Password123!x",
        confirmPassword: "Password123!x",
      }).isValid
    ).toBe(true);
  });
});

describe("validateSigninData", () => {
  it("requires email and password", () => {
    const result = validateSigninData({});
    expect(result.errors.email).toBe("Email is required");
    expect(result.errors.password).toBe("Password is required");
  });

  it("accepts a normal sign-in payload", () => {
    expect(
      validateSigninData({
        email: "alex.nguyen@candidate.edu.au",
        password: "Password123!",
      }).isValid
    ).toBe(true);
  });
});

describe("validateApplicationData", () => {
  const valid = {
    courseId: "course-1",
    roleId: "role-1",
    availability: "Part Time",
    skills: "Teaching",
    motivation: "I want to help students with weekly tutorial work.",
  };

  it("accepts a tutor application with a short skill tag", () => {
    expect(validateApplicationData(valid)).toEqual({
      isValid: true,
      errors: {},
    });
  });

  it("rejects skills that are too short as tags", () => {
    const result = validateApplicationData({ ...valid, skills: "T" });
    expect(result.errors.skills).toBe("Each skill must be at least 2 characters");
  });

  it("requires motivation of at least 20 characters", () => {
    const result = validateApplicationData({ ...valid, motivation: "too short" });
    expect(result.errors.motivation).toBe(
      "Motivation must be at least 20 characters long"
    );
  });
});
