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
} from "../../utils/authValidation.utils";
import { AuthService } from "../../../../shared/services/authService";
import { UserType } from "../../../../shared/types/user";
import { useAuth } from "../../hooks/useAuth";
import EmailAutocomplete from "../email-autocomplete/email-autocomplete";
import AppSelect from "@/shared/components/common/app-select/AppSelect";
import styles from "./signup-form.module.css";

const TITLE_PLACEHOLDER = "";

const CANDIDATE_HONORIFIC_OPTIONS = [
  { value: TITLE_PLACEHOLDER, label: "Title", isDefault: true },
  { value: "Mr.", label: "Mr." },
  { value: "Ms.", label: "Ms." },
  { value: "Mrs.", label: "Mrs." },
];

type CandidateHonorific = "Mr." | "Ms." | "Mrs." | "";

export default function SignUpForm() {
  const router = useRouter();
  const { } = useAuth(); // Removed login since we don't auto-login after signup
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"tutor" | "lecturer">("tutor");
  const [honorific, setHonorific] = useState<CandidateHonorific>(TITLE_PLACEHOLDER);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    // Validate title for candidates
    if (role === "tutor" && !honorific) {
      newErrors.honorific = "Please select a title";
    }

    // Validate email
    if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (!validateRoleSpecificEmail(email, role)) {
      const expectedDomain =
        role === "tutor" ? "@candidate.edu.au" : "@lecturer.edu.au";
      const roleDisplayName = role === "tutor" ? "Candidate" : "Lecturer";
      newErrors.email = `${roleDisplayName} email must end with ${expectedDomain}`;
    }

    // Validate password strength
    if (password.length === 0) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    } else if (containsEmojis(password)) {
      newErrors.password = "Password cannot contain emojis";
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
      // Split the full name into first and last name
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

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
        honorific:
          userType === UserType.CANDIDATE
            ? (honorific as CandidateHonorific)
            : "Dr.",
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
          setErrors(response.errors);
        }
        setApiError(
          response.message || "Failed to create account. Please try again."
        );
      }
    } catch (error) {
      console.error("Signup error:", error);
      setApiError(
        "Network error occurred. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Create Account</h2>

        {apiError && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            {apiError}
          </div>
        )}

        <div className={styles.inputContainer}>
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => handleInputChange("fullName", e.target.value)}
            required
            className={`${styles.inputField} ${errors.fullName ? styles.inputError : ""}`}
          />
          {errors.fullName && (
            <div className={styles.errorMessage}>
              {errors.fullName}
            </div>
          )}
        </div>

        {role === "tutor" && (
          <div className={styles.inputContainer}>
            <AppSelect
              id="honorific"
              value={honorific}
              onChange={(value) => {
                setHonorific(value as CandidateHonorific);
                if (errors.honorific) {
                  setErrors((prev) => ({ ...prev, honorific: "" }));
                }
                if (apiError) {
                  setApiError("");
                }
              }}
              options={CANDIDATE_HONORIFIC_OPTIONS}
              variant="pill"
              hasError={!!errors.honorific}
              className={styles.titleSelect}
              aria-label="Title"
            />
            {errors.honorific && (
              <div className={styles.errorMessage}>{errors.honorific}</div>
            )}
          </div>
        )}

        <div className={styles.inputContainer}>
          <EmailAutocomplete
            value={email}
            onChange={(value) => handleInputChange("email", value)}
            placeholder="Email Address"
            className={styles.inputField}
            role={role}
            hasError={!!errors.email}
          />
          {errors.email && (
            <div className={styles.errorMessage}>
              {errors.email}
            </div>
          )}
        </div>

        <div className={styles.passwordContainer}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            required
            className={`${styles.inputField} ${errors.password ? styles.inputError : ""}`}
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
          {errors.password && (
            <div className={styles.errorMessage}>
              {errors.password}
            </div>
          )}
        </div>

        {/* Password strength meter */}
        {password && (
          <>
            <div
              className={`${styles.passwordStrengthMeter} ${styles[passwordFeedback.level]}`}
            >
              <div className={styles.segment}></div>
              <div className={styles.segment}></div>
              <div className={styles.segment}></div>
              <div className={styles.segment}></div>
            </div>
            <div
              className={`${styles.passwordStrengthText} ${styles[passwordFeedback.level + "Text"]}`}
            >
              {passwordFeedback.text}
            </div>
          </>
        )}

        <div className={styles.passwordContainer}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) =>
              handleInputChange("confirmPassword", e.target.value)
            }
            required
            className={`${styles.inputField} ${errors.confirmPassword ? styles.inputError : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className={styles.passwordToggle}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
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
          {errors.confirmPassword && (
            <div className={styles.errorMessage}>
              {errors.confirmPassword}
            </div>
          )}
        </div>

        <div className={styles.roleSection}>
          <p className={styles.roleLabel}>I am a:</p>
          <div className={styles.roleToggleContainer}>
            <button
              type="button"
              className={`${styles.roleBtn} ${role === "tutor" ? styles.active : ""}`}
              onClick={() => setRole("tutor")}
            >
              Candidate
            </button>
            <button
              type="button"
              className={`${styles.roleBtn} ${role === "lecturer" ? styles.active : ""}`}
              onClick={() => setRole("lecturer")}
            >
              Lecturer
            </button>
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
