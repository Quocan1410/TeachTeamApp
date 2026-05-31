"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthService } from "@/shared/services/authService";
import {
  calculatePasswordStrength,
  getPasswordStrengthFeedback,
} from "../../utils/authValidation.utils";
import styles from "../signin-form/signin-form.module.css";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const passwordStrength = calculatePasswordStrength(password);
  const passwordFeedback = getPasswordStrengthFeedback(password, passwordStrength);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setErrors({});

    if (!tokenFromUrl) {
      setApiError("Invalid reset link. Request a new one from the forgot password page.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await AuthService.resetPassword({
        token: tokenFromUrl,
        password,
        confirmPassword,
      });
      if (response.success) {
        setSuccessMessage(
          response.message || "Password updated. You can sign in now."
        );
      } else if (response.errors) {
        setErrors(response.errors);
      } else {
        setApiError(response.message || "Unable to reset password.");
      }
    } catch {
      setApiError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!tokenFromUrl) {
    return (
      <div className={styles.formContainer}>
        <div className={styles.form}>
          <h2 className={styles.title}>Invalid link</h2>
          <div className={`${styles.alert} ${styles.alertError}`}>
            This reset link is missing or invalid.
          </div>
          <div className={styles.linkSection}>
            <Link href="/forgot-password" className={styles.link}>
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>Set new password</h2>

        {successMessage && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            {successMessage}
          </div>
        )}

        {apiError && (
          <div className={`${styles.alert} ${styles.alertError}`}>{apiError}</div>
        )}

        <div className={styles.passwordContainer}>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${styles.inputField} ${errors.password ? styles.inputError : ""}`}
            placeholder="New password"
            required
            disabled={isLoading || !!successMessage}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={styles.passwordToggle}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
          {errors.password && (
            <div className={styles.errorMessage}>{errors.password}</div>
          )}
          {password && passwordFeedback.text && (
            <p className={styles.linkText} style={{ fontSize: "0.75rem" }}>
              {passwordFeedback.text}
            </p>
          )}
        </div>

        <div className={styles.inputContainer}>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`${styles.inputField} ${errors.confirmPassword ? styles.inputError : ""}`}
            placeholder="Confirm new password"
            required
            disabled={isLoading || !!successMessage}
          />
          {errors.confirmPassword && (
            <div className={styles.errorMessage}>{errors.confirmPassword}</div>
          )}
        </div>

        <button
          type="submit"
          className={`${styles.submitButton} ${isLoading ? styles.loading : ""}`}
          disabled={isLoading || !!successMessage}
        >
          {isLoading ? "Updating..." : "Update password"}
        </button>

        <div className={styles.linkSection}>
          <p className={styles.linkText}>
            {successMessage ? (
              <Link href="/signin" className={styles.link}>
                Go to sign in
              </Link>
            ) : (
              <Link href="/forgot-password" className={styles.link}>
                Request a new link
              </Link>
            )}
          </p>
        </div>
      </form>
    </div>
  );
}
