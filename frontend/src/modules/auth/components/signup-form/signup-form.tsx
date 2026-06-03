"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  validateEmail,
  validateRoleSpecificEmail,
  calculatePasswordStrength,
  getPasswordStrengthFeedback,
  validateFullName,
  containsEmojis,
  validateSecurityAnswerRows,
  validateSignupPassword,
  splitSignupFullName,
  mapSignupApiErrors,
} from "../../utils/authValidation.utils";
import SecurityQuestionFields, {
  createEmptySecurityRows,
  type SecurityAnswerFormRow,
} from "../security-question-fields/SecurityQuestionFields";
import { AuthService } from "../../../../shared/services/authService";
import { UserType } from "../../../../shared/types/user";
import { useAuth } from "../../hooks/useAuth";
import EmailAutocomplete from "../email-autocomplete/email-autocomplete";
import AppSelect from "@/shared/components/common/app-select/AppSelect";
import { type Honorific } from "@/shared/utils/personDisplayName";
import grid from "@/modules/auth/styles/signup-grid.module.css";
import styles from "./signup-form.module.css";

const TITLE_PLACEHOLDER = "";

const HONORIFIC_OPTIONS = [
  { value: TITLE_PLACEHOLDER, label: "Title", isDefault: true },
  { value: "Mr.", label: "Mr." },
  { value: "Ms.", label: "Ms." },
  { value: "Mrs.", label: "Mrs." },
  { value: "Dr.", label: "Dr." },
  { value: "Prof.", label: "Prof." },
];

type SignupHonorific = Honorific | "";

export default function SignUpForm() {
  const router = useRouter();
  const { } = useAuth(); // Removed login since we don't auto-login after signup
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"tutor" | "lecturer">("tutor");
  const [honorific, setHonorific] = useState<SignupHonorific>(TITLE_PLACEHOLDER);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [securityRows, setSecurityRows] = useState<SecurityAnswerFormRow[]>(
    createEmptySecurityRows
  );

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Password strength calculation
  const passwordStrength = calculatePasswordStrength(password);
  const passwordFeedback = getPasswordStrengthFeedback(
    password,
    passwordStrength
  );

  const handleRoleChange = (next: "tutor" | "lecturer") => {
    setRole(next);
    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors.honorific;
      return nextErrors;
    });
  };

  const handleInputChange = (field: string, value: string) => {
    // Update form data
    switch (field) {
      case "fullName":
        setFullName(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        break;
    }

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    // Clear API error
    if (apiError) {
      setApiError("");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate full name
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (containsEmojis(fullName)) {
      newErrors.fullName = "Full name cannot contain emojis";
    } else if (!validateFullName(fullName)) {
      // Check if it's a word count issue or invalid characters
      const words = fullName.trim().split(/\s+/).filter(word => word.length > 0);
      if (words.length < 2) {
        newErrors.fullName = "Please enter both first name and last name";
      } else {
        newErrors.fullName = "Full name can only contain letters, apostrophes and hyphens";
      }
    }

    if (!honorific) {
      newErrors.honorific = "Please select a title";
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (!validateRoleSpecificEmail(email, role)) {
      const expectedDomain =
        role === "tutor" ? "@candidate.edu.au" : "@lecturer.edu.au";
      const roleDisplayName = role === "tutor" ? "Candidate" : "Lecturer";
      newErrors.email = `${roleDisplayName} email must end with ${expectedDomain}`;
    }

    // Validate password (backend rules first, then UI strength hint)
    const passwordRuleError = validateSignupPassword(password);
    if (passwordRuleError) {
      newErrors.password = passwordRuleError;
    } else if (
      passwordFeedback.level === "veryWeak" ||
      passwordFeedback.level === "weak"
    ) {
      newErrors.password =
        "Please choose a stronger password with uppercase, lowercase, numbers, and special characters";
    }

    // Validate confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    const securityErrors = validateSecurityAnswerRows(securityRows);
    Object.assign(newErrors, securityErrors);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setApiError("");

    // Validate form
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const { firstName, lastName } = splitSignupFullName(fullName);

      // Convert role to UserType
      const userType =
        role === "tutor" ? UserType.CANDIDATE : UserType.LECTURER;

      // Prepare the signup data in the format expected by the backend
      const signupData = {
        email: email.trim(),
        password,
        confirmPassword,
        firstName,
        lastName,
        userType,
        honorific: honorific as Honorific,
        securityAnswers: securityRows.map((row) => ({
          questionId: row.questionId,
          answer: row.answer.trim(),
        })),
      };

      // Call the signup API
      const response = await AuthService.signup(signupData);

      if (response.success && response.data) {
        // Don't auto-login after signup - redirect to signin page instead
        
        // Redirect to signin page with success message and email
        router.push(`/signin?message=Account created successfully! Please sign in.&email=${encodeURIComponent(email.trim())}`);
      } else {
        // Handle API errors
        if (response.errors) {
          setErrors(mapSignupApiErrors(response.errors));
        }
        setApiError(
          response.message || "Failed to create account. Please try again."
        );
      }
    } catch {
      setApiError(
        "Network error occurred. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h2 className={styles.title}>Create Account</h2>

        {apiError && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            {apiError}
          </div>
        )}

        <div className={styles.formStack}>
          <div className={styles.accountSection}>
            <p className={styles.sectionTitle}>Account</p>

            <div className={grid.stack}>
              <div className={grid.row}>
                <div className={grid.cell}>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    required
                    className={`${grid.control} ${errors.fullName ? grid.controlError : ""}`}
                  />
                  {errors.fullName && (
                    <span className={grid.fieldError}>{errors.fullName}</span>
                  )}
                </div>
                <div className={grid.cell}>
                  <div className={grid.controlWrap}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      required
                      className={`${grid.control} ${errors.password ? grid.controlError : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.passwordToggle}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={styles.icon}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={styles.icon}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                            clipRule="evenodd"
                          />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <span className={grid.fieldError}>{errors.password}</span>
                  )}
                </div>
              </div>

              {password && (
                <div className={`${grid.row} ${grid.rowTight}`}>
                  <div className={grid.cell} aria-hidden="true" />
                  <div className={grid.cell}>
                    <div
                      className={`${styles.passwordStrengthMeter} ${styles[passwordFeedback.level]}`}
                    >
                      <div className={styles.segment} />
                      <div className={styles.segment} />
                      <div className={styles.segment} />
                      <div className={styles.segment} />
                    </div>
                    <div
                      className={`${styles.passwordStrengthText} ${styles[passwordFeedback.level + "Text"]}`}
                    >
                      {passwordFeedback.text}
                    </div>
                  </div>
                </div>
              )}

              <div className={grid.row}>
                <div className={grid.cell}>
                  <AppSelect
                    id="honorific"
                    value={honorific}
                    onChange={(value) => {
                      setHonorific(value as SignupHonorific);
                      if (errors.honorific) {
                        setErrors((prev) => ({ ...prev, honorific: "" }));
                      }
                      if (apiError) {
                        setApiError("");
                      }
                    }}
                    options={HONORIFIC_OPTIONS}
                    variant="pill"
                    hasError={!!errors.honorific}
                    className={grid.selectWrap}
                    aria-label="Title"
                    aria-required="true"
                  />
                  {errors.honorific && (
                    <span className={grid.fieldError}>
                      {errors.honorific}
                    </span>
                  )}
                </div>
                <div className={grid.cell}>
                  <div className={grid.controlWrap}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      required
                      className={`${grid.control} ${errors.confirmPassword ? grid.controlError : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className={styles.passwordToggle}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={styles.icon}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={styles.icon}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                            clipRule="evenodd"
                          />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className={grid.fieldError}>
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>
              </div>

              <div className={grid.row}>
                <div className={grid.cell}>
                  <EmailAutocomplete
                    value={email}
                    onChange={(value) => handleInputChange("email", value)}
                    placeholder="Email Address"
                    className={`${grid.control} ${errors.email ? grid.controlError : ""}`}
                    role={role}
                    hasError={!!errors.email}
                    required
                  />
                  {errors.email && (
                    <span className={grid.fieldError}>{errors.email}</span>
                  )}
                </div>
                <div className={grid.cell}>
                  <div
                    className={styles.roleSection}
                    role="group"
                    aria-labelledby="signup-role-label"
                  >
                    <p id="signup-role-label" className={styles.roleLabel}>
                      I am a:
                    </p>
                    <div className={styles.roleToggleContainer}>
                      <button
                        type="button"
                        className={`${styles.roleBtn} ${role === "tutor" ? styles.active : ""}`}
                        onClick={() => handleRoleChange("tutor")}
                      >
                        Candidate
                      </button>
                      <button
                        type="button"
                        className={`${styles.roleBtn} ${role === "lecturer" ? styles.active : ""}`}
                        onClick={() => handleRoleChange("lecturer")}
                      >
                        Lecturer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.securitySection}>
            <SecurityQuestionFields
              rows={securityRows}
              onChange={(rows) => {
                setSecurityRows(rows);
                if (Object.keys(errors).some((k) => k.startsWith("securityAnswers"))) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    Object.keys(next).forEach((key) => {
                      if (key.startsWith("securityAnswers")) {
                        delete next[key];
                      }
                    });
                    return next;
                  });
                }
              }}
              errors={errors}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className={styles.submitContainer}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </div>

        <div className={styles.linkSection}>
          <p className={styles.linkText}>
            Already have an account?{" "}
            <Link href="/signin" className={styles.link}>
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
