"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthService } from "@/shared/services/authService";
import type { PasswordResetChallengeQuestion } from "@/shared/types/user";
import SecurityQuestionFields, {
  createEmptySecurityRows,
  type SecurityAnswerFormRow,
} from "../security-question-fields/SecurityQuestionFields";
import { validateSecurityAnswerRows } from "../../utils/authValidation.utils";
import styles from "../signin-form/signin-form.module.css";

type Step = "email" | "questions";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [challengeQuestions, setChallengeQuestions] = useState<
    PasswordResetChallengeQuestion[]
  >([]);
  const [securityRows, setSecurityRows] = useState<SecurityAnswerFormRow[]>(
    createEmptySecurityRows
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setErrors({});

    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await AuthService.forgotPasswordChallenge(email.trim());
      if (response.success && response.data?.questions?.length) {
        const questions = response.data.questions;
        setChallengeQuestions(questions);
        setSecurityRows(
          questions.map((q) => ({ questionId: q.questionId, answer: "" }))
        );
        setStep("questions");
      } else {
        setApiError(
          response.message ||
            "We could not start recovery for that email. Check the address or sign in."
        );
      }
    } catch {
      setApiError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    const validationErrors = validateSecurityAnswerRows(securityRows);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await AuthService.forgotPasswordVerify(
        email.trim(),
        securityRows.map((row) => ({
          questionId: row.questionId,
          answer: row.answer.trim(),
        }))
      );

      if (response.success && response.data?.resetUrl) {
        router.push(response.data.resetUrl);
        return;
      }

      setApiError(
        response.message ||
          "Incorrect answers. Please try again or return to sign in."
      );
      if (response.errors) {
        setErrors(response.errors);
      }
    } catch {
      setApiError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <form
        onSubmit={step === "email" ? handleEmailSubmit : handleVerifySubmit}
        className={styles.form}
      >
        <h2 className={styles.title}>Forgot password</h2>

        {step === "email" ? (
          <p
            className={styles.linkText}
            style={{ textAlign: "center", marginBottom: "1rem" }}
          >
            Enter your account email. We will ask your security questions to
            verify your identity.
          </p>
        ) : (
          <p
            className={styles.linkText}
            style={{ textAlign: "center", marginBottom: "1rem" }}
          >
            Answer the security questions you chose when you signed up.
          </p>
        )}

        {apiError && (
          <div className={`${styles.alert} ${styles.alertError}`}>{apiError}</div>
        )}

        {step === "email" ? (
          <>
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
                disabled={isLoading}
              />
              {errors.email && (
                <div className={styles.errorMessage}>{errors.email}</div>
              )}
            </div>

            <button
              type="submit"
              className={`${styles.submitButton} ${isLoading ? styles.loading : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Continue"}
            </button>
          </>
        ) : (
          <>
            <SecurityQuestionFields
              rows={securityRows}
              onChange={setSecurityRows}
              errors={errors}
              disabled={isLoading}
              lockedQuestions={challengeQuestions}
              heading="Your security questions"
            />

            <button
              type="submit"
              className={`${styles.submitButton} ${isLoading ? styles.loading : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify and reset password"}
            </button>

            <button
              type="button"
              className={styles.link}
              style={{
                display: "block",
                margin: "1rem auto 0",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => {
                setStep("email");
                setApiError("");
                setErrors({});
              }}
              disabled={isLoading}
            >
              Use a different email
            </button>
          </>
        )}

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
