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
import signinStyles from "../signin-form/signin-form.module.css";
import styles from "./forgot-password-form.module.css";

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

  const normalizedEmail = email.trim().toLowerCase();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setErrors({});

    if (!normalizedEmail) {
      setErrors({ email: "Email is required" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await AuthService.forgotPasswordChallenge(normalizedEmail);
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
        normalizedEmail,
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
    <div
      className={`${styles.formContainer} ${
        step === "questions" ? styles.formContainerWide : ""
      }`.trim()}
    >
      <form
        onSubmit={step === "email" ? handleEmailSubmit : handleVerifySubmit}
        className={signinStyles.form}
      >
        <h2 className={signinStyles.title}>Forgot password</h2>
        <p className={styles.stepLabel}>
          Step {step === "email" ? "1" : "2"} of 2
        </p>

        {step === "email" ? (
          <p className={styles.stepDescription}>
            Enter your account email. We will ask your security questions to
            verify your identity.
          </p>
        ) : (
          <p className={styles.stepDescription}>
            Verifying <strong>{normalizedEmail}</strong> — answer your security
            questions below.
          </p>
        )}

        {apiError && (
          <div className={`${signinStyles.alert} ${signinStyles.alertError}`}>
            {apiError}
          </div>
        )}

        {step === "email" ? (
          <>
            <div className={signinStyles.inputContainer}>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({});
                }}
                className={`${signinStyles.inputField} ${
                  errors.email ? signinStyles.inputError : ""
                }`}
                placeholder="Email Address"
                required
                disabled={isLoading}
              />
              {errors.email && (
                <div className={signinStyles.errorMessage}>{errors.email}</div>
              )}
            </div>

            <button
              type="submit"
              className={`${signinStyles.submitButton} ${
                isLoading ? signinStyles.loading : ""
              }`}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Continue"}
            </button>
          </>
        ) : (
          <div className={styles.verifyActions}>
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
              className={`${signinStyles.submitButton} ${
                isLoading ? signinStyles.loading : ""
              }`}
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify and reset password"}
            </button>

            <button
              type="button"
              className={`${signinStyles.link} ${styles.secondaryLinkButton}`}
              onClick={() => {
                setStep("email");
                setApiError("");
                setErrors({});
              }}
              disabled={isLoading}
            >
              Use a different email
            </button>
          </div>
        )}

        <div className={signinStyles.linkSection}>
          <p className={signinStyles.linkText}>
            <Link href="/signin" className={signinStyles.link}>
              Back to sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
