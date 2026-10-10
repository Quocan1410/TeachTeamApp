"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";
import {
  validateEmail,
  validateRoleSpecificEmail,
  calculatePasswordStrength,
  getPasswordStrengthFeedback,
  validateFullName,
  containsEmojis,
  validateSignupPassword,
  splitSignupFullName,
  mapSignupApiErrors,
} from "@/modules/auth/utils/authValidation.utils";
import { AuthService } from "@/shared/services/authService";
import Toast from "@/shared/components/common/toast/toast";
import { useToast } from "@/shared/hooks/useNotification";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { UserType } from "@/shared/types/user";
import EmailAutocomplete from "@/modules/auth/components/email-autocomplete/email-autocomplete";
import AppSelect from "@/shared/components/common/app-select/AppSelect";
import { type Honorific } from "@/shared/utils/personDisplayName";
import grid from "@/modules/auth/styles/signup-grid.module.css";
import PasskeyOffer from "@/modules/auth/components/passkey-offer/PasskeyOffer";
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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const debouncedPassword = useDebouncedValue(password, 320);
  const debouncedConfirmPassword = useDebouncedValue(confirmPassword, 320);
  const confirmCheckReady =
    confirmPassword.length > 0 &&
    debouncedConfirmPassword === confirmPassword &&
    debouncedPassword === password;
  const passwordsMatch = confirmCheckReady && password === confirmPassword;
  const passwordsDiffer = confirmCheckReady && password !== confirmPassword;
  const [role, setRole] = useState<"tutor" | "lecturer">("tutor");
  const [honorific, setHonorific] = useState<SignupHonorific>(TITLE_PLACEHOLDER);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [askPasskey, setAskPasskey] = useState(false);
  const [createdEmail, setCreatedEmail] = useState("");
  const { toast, showError, hideToast } = useToast();

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const { firstName, lastName } = splitSignupFullName(fullName);

      // Convert role to UserType
      const userType =
        role === "tutor" ? UserType.CANDIDATE : UserType.LECTURER;

      // Prepare the signup data in the format expected by the backend
      const signupEmail = email.trim().toLowerCase();
      const signupData = {
        email: signupEmail,
        password,
        firstName,
        lastName,
        userType,
        honorific: honorific || undefined,
      };

      const response = await AuthService.signup(signupData);

      if (response.success && response.data) {
        setCreatedEmail(signupEmail);
        setAskPasskey(true);
      } else {
        if (response.errors) {
          setErrors(mapSignupApiErrors(response.errors));
        }
        showError(
          response.message || "Failed to create account. Please try again."
        );
      }
    } catch {
      showError(
        "Network error occurred. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || askPasskey || !isAuthenticated || !user) return;
    if (user.userType === "admin") {
      window.location.assign(
        process.env.NEXT_PUBLIC_ADMIN_APP_URL || "http://localhost:3001"
      );
      return;
    }
    if (user.userType === "lecturer") {
      router.replace("/lecturer");
      return;
    }
    if (user.userType === "candidate") {
      router.replace("/tutor");
      return;
    }
    router.replace("/");
  }, [authLoading, askPasskey, isAuthenticated, user, router]);

  const finishSignup = (notice: string) => {
    router.push(
      `/signin?message=${encodeURIComponent(notice)}&email=${encodeURIComponent(createdEmail)}`
    );
  };

  if (!askPasskey && (authLoading || isAuthenticated)) {
    return <PageSkeleton variant="auth" />;
  }

  if (askPasskey) {
    return (
      <div className={styles.signupForm}>
        <PasskeyOffer onDone={finishSignup} onError={showError} />
        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onClose={hideToast}
          autoCloseDelay={5000}
        />
      </div>
    );
  }

  return (
    <div className={styles.signupForm}>
      <form className={styles.signupForm__form} onSubmit={handleSubmit} noValidate>
        <h2 className={styles.signupForm__title}>Create Account</h2>

        <div className={styles.signupForm__stack}>
          <div className={styles.signupForm__account}>
            <p className={styles.signupForm__heading}>Account</p>

            <div className={grid.signupGrid__stack}>
              <div className={grid.signupGrid__row}>
                <div className={grid.signupGrid__cell}>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    required
                    className={`${grid.signupGrid__input} ${errors.fullName ? grid["signupGrid__input--error"] : ""}`}
                  />
                  {errors.fullName && (
                    <span className={grid.signupGrid__error}>{errors.fullName}</span>
                  )}
                </div>
                <div className={grid.signupGrid__cell}>
                  <AppSelect
                    id="honorific"
                    value={honorific}
                    onChange={(value) => {
                      setHonorific(value as SignupHonorific);
                      if (errors.honorific) {
                        setErrors((prev) => ({ ...prev, honorific: "" }));
                      }
                    }}
                    options={HONORIFIC_OPTIONS}
                    variant="pill"
                    hasError={!!errors.honorific}
                    className={grid.signupGrid__select}
                    aria-label="Title"
                    aria-required="true"
                  />
                  {errors.honorific && (
                    <span className={grid.signupGrid__error}>
                      {errors.honorific}
                    </span>
                  )}
                </div>
              </div>

              <div className={grid.signupGrid__row}>
                <div className={grid.signupGrid__cell}>
                  <div className={grid.signupGrid__wrap}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onFocus={() => {
                        if (!errors.password) return;
                        handleInputChange("password", "");
                      }}
                      onClick={() => {
                        if (!errors.password) return;
                        handleInputChange("password", "");
                      }}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      required
                      className={`${grid.signupGrid__input} ${errors.password ? grid["signupGrid__input--error"] : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.signupForm__toggle}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={styles.signupForm__icon}
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
                          className={styles.signupForm__icon}
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
                  {password && (
                    <>
                      <div
                        className={`${styles.signupForm__meter} ${
                          passwordFeedback.level
                            ? styles[`signupForm__meter--${passwordFeedback.level}`]
                            : ""
                        }`}
                      >
                        <div className={styles.signupForm__segment} />
                        <div className={styles.signupForm__segment} />
                        <div className={styles.signupForm__segment} />
                        <div className={styles.signupForm__segment} />
                      </div>
                      <div
                        className={`${styles.signupForm__strength} ${
                          passwordFeedback.level
                            ? styles[`signupForm__strength--${passwordFeedback.level}`]
                            : ""
                        }`}
                      >
                        {passwordFeedback.text}
                      </div>
                    </>
                  )}
                  {errors.password && (
                    <span className={grid.signupGrid__error}>{errors.password}</span>
                  )}
                </div>
                <div className={grid.signupGrid__cell}>
                  <div className={grid.signupGrid__wrap}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onFocus={() => {
                        if (!errors.confirmPassword) return;
                        handleInputChange("confirmPassword", "");
                      }}
                      onClick={() => {
                        if (!errors.confirmPassword) return;
                        handleInputChange("confirmPassword", "");
                      }}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      required
                      className={`${grid.signupGrid__input} ${
                        errors.confirmPassword || passwordsDiffer
                          ? grid["signupGrid__input--error"]
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className={styles.signupForm__toggle}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={styles.signupForm__icon}
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
                          className={styles.signupForm__icon}
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
                  {errors.confirmPassword ? (
                    <span className={grid.signupGrid__error}>
                      {errors.confirmPassword}
                    </span>
                  ) : passwordsDiffer ? (
                    <span className={grid.signupGrid__error}>Passwords do not match</span>
                  ) : passwordsMatch ? (
                    <span className={styles.signupForm__match}>Passwords match</span>
                  ) : null}
                </div>
              </div>

              <div className={grid.signupGrid__row}>
                <div className={grid.signupGrid__cell}>
                  <EmailAutocomplete
                    value={email}
                    onChange={(value) => handleInputChange("email", value)}
                    placeholder="Email Address"
                    className={`${grid.signupGrid__input} ${errors.email ? grid["signupGrid__input--error"] : ""}`}
                    role={role}
                    hasError={!!errors.email}
                    required
                  />
                  {errors.email && (
                    <span className={grid.signupGrid__error}>{errors.email}</span>
                  )}
                </div>
                <div className={grid.signupGrid__cell}>
                  <div
                    className={styles.signupForm__roleBox}
                    role="group"
                    aria-labelledby="signup-role-label"
                  >
                    <p id="signup-role-label" className={styles.signupForm__roleLabel}>
                      I am a:
                    </p>
                    <div className={styles.signupForm__roles}>
                      <button
                        type="button"
                        className={`${styles.signupForm__role} ${role === "tutor" ? styles["signupForm__role--active"] : ""}`}
                        onClick={() => handleRoleChange("tutor")}
                      >
                        Candidate
                      </button>
                      <button
                        type="button"
                        className={`${styles.signupForm__role} ${role === "lecturer" ? styles["signupForm__role--active"] : ""}`}
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
        </div>

        <div className={styles.signupForm__actions}>
          <button
            type="submit"
            className={styles.signupForm__submit}
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </div>

        <div className={styles.signupForm__links}>
          <p className={styles.signupForm__linkText}>
            Already have an account?{" "}
            <Link href="/signin" className={styles.signupForm__link}>
              Sign In
            </Link>
          </p>
        </div>
      </form>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
        autoCloseDelay={5000}
      />
    </div>
  );
}