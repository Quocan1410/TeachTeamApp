import {
  calculatePasswordStrength,
  containsEmojis,
  getPasswordStrengthFeedback,
  mapSignupApiErrors,
  splitSignupFullName,
  validateEmail,
  validateFullName,
  validateMinPasswordLength,
  validateRoleSpecificEmail,
  validateSignupPassword,
} from "./authValidation.utils";

describe("email and role helpers", () => {
  it("validates a basic email shape", () => {
    expect(validateEmail("a@b.com")).toBe(true);
    expect(validateEmail("not-an-email")).toBe(false);
  });

  it("checks school domains by role", () => {
    expect(validateRoleSpecificEmail("a@candidate.edu.au", "tutor")).toBe(true);
    expect(validateRoleSpecificEmail("a@lecturer.edu.au", "lecturer")).toBe(true);
    expect(validateRoleSpecificEmail("a@gmail.com", "tutor")).toBe(false);
  });
});

describe("name helpers", () => {
  it("requires first and last name with letters only", () => {
    expect(validateFullName("Eden Coverage")).toBe(true);
    expect(validateFullName("Eden")).toBe(false);
    expect(validateFullName("Eden 123")).toBe(false);
  });

  it("splits the signup full name on the first space", () => {
    expect(splitSignupFullName("Eden Ann Coverage")).toEqual({
      firstName: "Eden",
      lastName: "Ann Coverage",
    });
  });

  it("maps API first and last name errors onto fullName", () => {
    expect(
      mapSignupApiErrors({ firstName: "First name is required", email: "bad" })
    ).toEqual({
      fullName: "First name is required",
      email: "bad",
    });
  });
});

describe("password helpers", () => {
  it("checks the minimum length", () => {
    expect(validateMinPasswordLength("12345678")).toBe(true);
    expect(validateMinPasswordLength("short")).toBe(false);
  });

  it("validates signup password rules", () => {
    expect(validateSignupPassword("")).toBe("Password is required");
    expect(validateSignupPassword("Password123!")).toBeNull();
    expect(containsEmojis("hi😊")).toBe(true);
  });

  it("scores password strength", () => {
    const strong = calculatePasswordStrength("Password123!");
    expect(strong).toEqual({
      length: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
    });
    expect(getPasswordStrengthFeedback("Password123!", strong)).toEqual({
      text: "Strong password",
      level: "strong",
    });
    expect(getPasswordStrengthFeedback("", strong)).toEqual({
      text: "",
      level: "",
    });
  });
});
