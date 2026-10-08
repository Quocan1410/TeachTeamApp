"use client";
import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthService } from "@/shared/services/authService";
import {
  containsEmojis,
} from "@/modules/auth/utils/authValidation.utils";
import { SigninData, User } from "@/shared/types/user";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { LoginSuccessModal } from "@/shared/components/common/modal/LoginSuccessModal";
import Toast from "@/shared/components/common/toast/toast";
import { useToast } from "@/shared/hooks/useNotification";
import { preloadDashboardRoute } from "@/modules/auth/utils/preloadDashboard";
import { signInWithPasskey } from "@/modules/auth/utils/passkey";
import styles from "./signin-form.module.css";

const PRELOAD_TIMEOUT_MS = 12000;

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [formData, setFormData] = useState<SigninData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<SigninData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [clearPasswordOnEdit, setClearPasswordOnEdit] = useState(false);
  const [shakeEmail, setShakeEmail] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  // New state for login success modal
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [redirectPath, setRedirectPath] = useState<string>("");
  const [isDashboardReady, setIsDashboardReady] = useState(false);

  const getRedirectPath = useCallback((targetUser: User) => {
    if (targetUser.userType === "admin") {
      return (
        process.env.NEXT_PUBLIC_ADMIN_APP_URL || "http://localhost:3001"
      );
    }
    if (targetUser.userType === "lecturer") return "/lecturer";
    if (targetUser.userType === "candidate") return "/tutor";
    return "/";
  }, []);

  const navigateAfterLogin = useCallback((destination: string) => {
    window.scrollTo(0, 0);
    if (/^https?:\/\//i.test(destination)) {
      window.location.assign(destination);
      return;
    }
    router.replace(destination);
  }, [router]);

  const isExternalRedirect = (path: string) => /^https?:\/\//i.test(path);

  // Check for success message and email from signup redirect
  useEffect(() => {
    const message = searchParams.get('message');
    const email = searchParams.get('email');
    
    if (message) {
      showSuccess(message);
    }
    
    if (email) {
      setFormData(prev => ({
        ...prev,
        email: decodeURIComponent(email)
      }));
    }
    
  }, [searchParams, showSuccess]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !user || showLoginSuccess) return;
    navigateAfterLogin(getRedirectPath(user));
  }, [
    isAuthLoading,
    isAuthenticated,
    user,
    showLoginSuccess,
    navigateAfterLogin,
    getRedirectPath,
  ]);

  useEffect(() => {
    if (!showLoginSuccess || !redirectPath) return;
    if (isExternalRedirect(redirectPath)) {
      setIsDashboardReady(true);
      return;
    }
    let cancelled = false;
    setIsDashboardReady(false);

    const prepareDashboard = async () => {
      const timeout = new Promise<void>((resolve) => {
        setTimeout(resolve, PRELOAD_TIMEOUT_MS);
      });

      try {
        await Promise.race([
          Promise.all([
            router.prefetch(redirectPath),
            preloadDashboardRoute(redirectPath),
          ]),
          timeout,
        ]);
      } catch {
        // Preload is best-effort only.
      } finally {
        if (!cancelled) {
          setIsDashboardReady(true);
        }
      }
    };

    void prepareDashboard();
    return () => {
      cancelled = true;
    };
  }, [showLoginSuccess, redirectPath, router]);

  if (!isAuthLoading && isAuthenticated && !showLoginSuccess) {
    return null;
  }

  const shakeFields = (email: boolean, password: boolean) => {
    setShakeEmail(false);
    setShakePassword(false);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setShakeEmail(email);
        setShakePassword(password);
      });
    });
  };

  const handleInputChange = (field: keyof SigninData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SigninData> = {};

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Validate password
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (containsEmojis(formData.password)) {
      newErrors.password = "Password cannot contain emojis";
    }

    setErrors(newErrors);
    if (newErrors.email || newErrors.password) {
      shakeFields(Boolean(newErrors.email), Boolean(newErrors.password));
      showError(newErrors.email || newErrors.password || "Invalid email or password");
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Modal is open — ignore Enter / stray submits so login is not run twice.
    if (showLoginSuccess) {
      return;
    }

    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await AuthService.signin(formData);

      if (response.success && response.data) {
        beginSignedInSession(response.data.user);
      } else {
        setClearPasswordOnEdit(true);
        const emailWrong = Boolean(response.errors?.email);
        const passwordWrong = Boolean(response.errors?.password);
        if (response.errors) {
          setErrors(response.errors);
        }
        showError(
          response.message?.trim() ||
            response.errors?.email ||
            response.errors?.password ||
            "Invalid email or password",
        );
        const genericFailure = !emailWrong && !passwordWrong;
        shakeFields(emailWrong || genericFailure, passwordWrong || genericFailure);
      }
    } catch {
      showError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const beginSignedInSession = (nextUser: User) => {
    login(nextUser);
    const nextPath = getRedirectPath(nextUser);
    setRedirectPath(nextPath);
    setIsDashboardReady(false);
    setLoggedInUser(nextUser);
    setShowLoginSuccess(true);
    if (!isExternalRedirect(nextPath)) {
      void preloadDashboardRoute(nextPath);
    } else {
      setIsDashboardReady(true);
    }
  };

  const handlePasskey = async () => {
    if (showLoginSuccess || isLoading) return;
    setIsLoading(true);
    try {
      const response = await signInWithPasskey();
      if (response.success && response.data?.user) {
        beginSignedInSession(response.data.user);
      } else {
        showError(response.message?.trim() || "Passkey could not be verified.");
      }
    } catch {
      showError("Passkey could not be verified.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccessModalHide = () => {
    const destination =
      redirectPath || (loggedInUser ? getRedirectPath(loggedInUser) : "/");
    setShowLoginSuccess(false);
    navigateAfterLogin(destination);
  };

  return (
    <>
      <div className={styles.formContainer}>
        <div className={styles.mascotSeat} aria-hidden="true">
          <Image
            src="/mascot/mascot-3.png"
            alt=""
            width={377}
            height={661}
            priority
            className={styles.mascot}
          />
        </div>
        <form
          onSubmit={handleSubmit}
          className={styles.form}
          aria-hidden={showLoginSuccess}
        >
          <h2 className={styles.title}>Welcome Back</h2>

          <div
            className={`${styles.inputContainer} ${shakeEmail ? styles.shake : ""}`}
          >
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`${styles.inputField} ${errors.email ? styles.inputError : ""}`}
              placeholder="Email Address"
              required
              disabled={showLoginSuccess}
            />
            {errors.email && (
              <div className={styles.errorMessage}>
                {errors.email}
              </div>
            )}
          </div>

          <div
            className={`${styles.passwordContainer} ${shakePassword ? styles.shake : ""}`}
          >
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onFocus={() => {
                if (!clearPasswordOnEdit) return;
                setClearPasswordOnEdit(false);
                handleInputChange("password", "");
              }}
              onClick={() => {
                if (!clearPasswordOnEdit) return;
                setClearPasswordOnEdit(false);
                handleInputChange("password", "");
              }}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`${styles.inputField} ${errors.password ? styles.inputError : ""}`}
              placeholder="Password"
              required
              disabled={showLoginSuccess}
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

          <button
            type="submit"
            className={`${styles.submitButton} ${isLoading ? styles.loading : ""}`}
            disabled={isLoading || showLoginSuccess}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>

          <div className={styles.orDivider} role="separator">
            <span>or</span>
          </div>

          <button
            type="button"
            className={styles.passkeyButton}
            disabled={isLoading || showLoginSuccess}
            onClick={handlePasskey}
          >
            Use a passkey
          </button>

          <div className={styles.linkSection}>
            <p className={styles.linkText}>
              <Link href="/forgot-password" className={styles.link}>
                Forgot password?
              </Link>
            </p>
            <p className={styles.linkText}>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className={styles.link}>
                Create one here
              </Link>
            </p>
          </div>
        </form>
      </div>
      
      {/* Login Success Modal */}
      {showLoginSuccess && loggedInUser && (
        <LoginSuccessModal
          user={loggedInUser}
          isVisible={showLoginSuccess}
          onHide={handleLoginSuccessModalHide}
          duration={3000}
          isPreparing={!isDashboardReady}
        />
      )}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
        autoCloseDelay={5000}
      />
    </>
  );
}
