"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthService } from "@/shared/services/authService";
import styles from "../signin-form/signin-form.module.css";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");
    setDevResetUrl("");
    setErrors({});

    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await AuthService.forgotPassword(email.trim());
      if (response.success) {
        setSuccessMessage(
          response.message ||
            "If an account exists for that email, we sent password reset instructions."
        );
        if (response.resetUrl) {
          setDevResetUrl(response.resetUrl);
        }
      } else if (response.errors) {
        setErrors(response.errors);
      } else {
        setApiError(response.message || "Unable to send reset instructions.");
      }
    } catch {
      setApiError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>Forgot password</h2>
        <p className={styles.linkText} style={{ textAlign: "center", marginBottom: "1rem" }}>
          Enter your account email. We will send a link to reset your password.
        </p>

        {successMessage && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            {successMessage}
          </div>
        )}

        {devResetUrl && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            <p style={{ marginBottom: "0.5rem" }}>
              Development mode (SMTP not configured):
            </p>
            <Link href={devResetUrl} className={styles.link}>
              Open reset link
            </Link>
          </div>
        )}

        {apiError && (
          <div className={`${styles.alert} ${styles.alertError}`}>{apiError}</div>
        )}

        <div className={styles.inputContainer}>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({});
            }}
            className={`${styles.inputField} ${errors.email ? styles.inputError : ""}`}
            placeholder="Email Address"
            required
            disabled={isLoading || !!successMessage}
          />
          {errors.email && (
            <div className={styles.errorMessage}>{errors.email}</div>
          )}
        </div>

        <button
          type="submit"
          className={`${styles.submitButton} ${isLoading ? styles.loading : ""}`}
          disabled={isLoading || !!successMessage}
        >
          {isLoading ? "Sending..." : "Send reset link"}
        </button>

        <div className={styles.linkSection}>
          <p className={styles.linkText}>
            <Link href="/signin" className={styles.link}>
              Back to sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
