import type { SecurityAnswerFormRow } from "../components/security-question-fields/SecurityQuestionFields";
import { SECURITY_QUESTION_COUNT } from "@/shared/constants/securityQuestions";

// Check if the email follows the pattern for specific roles
export const validateRoleSpecificEmail = (
  email: string,
  role: "tutor" | "lecturer"
): boolean => {
  const emailLowercase = email.toLowerCase();
  if (role === "tutor") {
    return emailLowercase.endsWith("@candidate.edu.au");
  } else if (role === "lecturer") {
    return emailLowercase.endsWith("@lecturer.edu.au");
  }
  return false;
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Basic password validation (e.g., length)
export const validateMinPasswordLength = (password: string): boolean => {
  return password.length >= 8;
};

// Password strength calculation
export interface PasswordStrengthCriteria {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

// Full name validation
export const validateFullName = (fullName: string): boolean => {
  if (!fullName.trim()) return false;

  // Split by spaces and filter out empty strings
  const words = fullName.trim().split(/\s+/).filter(word => word.length > 0);

  // Must have at least 2 words (first name + last name)
  if (words.length < 2) return false;

  // Each word must be at least 1 character and contain only valid characters
  const nameRegex = /^[a-zA-Z'-]+$/;
  return words.every(word => nameRegex.test(word));
};

/** Matches backend signup name split (first word → firstName, rest → lastName). */
export const splitSignupFullName = (
  fullName: string
): { firstName: string; lastName: string } => {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: words[0] || "",
    lastName: words.slice(1).join(" ") || "",
  };
};

/** Map REST signup field errors to signup-form field names. */
export const mapSignupApiErrors = (
  apiErrors: Record<string, string>
): Record<string, string> => {
  const mapped = { ...apiErrors };
  if (mapped.firstName || mapped.lastName) {
    const parts = [mapped.firstName, mapped.lastName].filter(Boolean);
    mapped.fullName = parts.join(" ");
    delete mapped.firstName;
    delete mapped.lastName;
  }
  return mapped;
};

/** Password rules aligned with backend validateSignupData. */
export const validateSignupPassword = (password: string): string | null => {
  if (!password) {
    return "Password is required";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
  }
  if (containsEmojis(password)) {
    return "Password cannot contain emojis";
  }
  return null;
};

// Check if password contains emojis
export const containsEmojis = (text: string): boolean => {
  // More comprehensive emoji detection including surrogate pairs
  const emojiRegex = /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\uD800-\uDBFF][\uDC00-\uDFFF]/u;
  return emojiRegex.test(text);
};

export const calculatePasswordStrength = (
  password: string
): PasswordStrengthCriteria => {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
};

// Helper to get password strength text (could be combined with CSS class logic if preferred)
export const getPasswordStrengthFeedback = (
  password: string,
  strength: PasswordStrengthCriteria
): {
  text: string;
  level: "veryWeak" | "weak" | "medium" | "strong" | "";
} => {
  if (password.length === 0) return { text: "", level: "" };
  if (password.length < 4)
    return { text: "Very weak password", level: "veryWeak" };
  if (password.length < 6)
    return { text: "Please use 6+ characters", level: "weak" };
  if (
    strength.length &&
    strength.uppercase &&
    strength.lowercase &&
    strength.number &&
    strength.special
  )
    return { text: "Strong password", level: "strong" };
  if (
    strength.length &&
    (strength.uppercase || strength.lowercase) &&
    (strength.number || strength.special)
  )
    return { text: "Good password", level: "medium" };
  return { text: "Weak password", level: "weak" };
};

export const validateSecurityAnswerRows = (
  rows: SecurityAnswerFormRow[]
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const used = new Set<string>();

  if (rows.length !== SECURITY_QUESTION_COUNT) {
    errors.securityAnswers = `Please set ${SECURITY_QUESTION_COUNT} security questions`;
    return errors;
  }

  rows.forEach((row, index) => {
    if (!row.questionId) {
      errors[`securityAnswers.${index}.questionId`] = "Question is required";
    } else if (used.has(row.questionId)) {
      errors.securityAnswers = "Each question must be different";
    } else {
      used.add(row.questionId);
    }

    const trimmedAnswer = row.answer.trim();
    const normalized = trimmedAnswer.toLowerCase();
    if (!trimmedAnswer) {
      errors[`securityAnswers.${index}.answer`] = "Answer is required";
    } else if (normalized.length < 2) {
      errors[`securityAnswers.${index}.answer`] =
        "Answer must be at least 2 characters";
    } else if (normalized.length > 100) {
      errors[`securityAnswers.${index}.answer`] =
        "Answer must be at most 100 characters";
    }
  });

  if (
    used.size !== SECURITY_QUESTION_COUNT &&
    !errors.securityAnswers
  ) {
    errors.securityAnswers = `Please set ${SECURITY_QUESTION_COUNT} different security questions`;
  }

  return errors;
};
