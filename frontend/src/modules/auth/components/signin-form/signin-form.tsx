"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthService } from "../../../../shared/services/authService";
import {
  containsEmojis,
} from "../../utils/authValidation.utils";
import { SigninData, User } from "../../../../shared/types/user";
import { useAuth } from "../../hooks/useAuth";
import { LoginSuccessModal } from "../../../../shared/components/common/modal/LoginSuccessModal";
import { preloadDashboardRoute } from "../../utils/preloadDashboard";
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
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // New state for login success modal
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [redirectPath, setRedirectPath] = useState<string>("");
  const [isDashboardReady, setIsDashboardReady] = useState(false);

  const getRedirectPath = (targetUser: User) =>
    targetUser.userType === "lecturer"
      ? "/lecturer"
      : targetUser.userType === "candidate"
        ? "/tutor"
        : "/";

  // Check for success message and email from signup redirect
  useEffect(() => {
    const message = searchParams.get('message');
    const email = searchParams.get('email');
    
    if (message) {
      setSuccessMessage(message);
    }
    
    if (email) {
      setFormData(prev => ({
        ...prev,
        email: decodeURIComponent(email)
      }));
    }
    
    // Clear URL parameters after processing
    if (message || email) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !user || showLoginSuccess) return;
    router.replace(getRedirectPath(user));
  }, [isAuthLoading, isAuthenticated, user, showLoginSuccess, router]);

  useEffect(() => {
    if (!showLoginSuccess || !redirectPath) return;
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
      } catch (error) {
        console.warn("Dashboard preload failed, continuing anyway:", error);
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

    // Clear API error
    if (apiError) {
      setApiError("");
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
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Modal is open — ignore Enter / stray submits so login is not run twice.
    if (showLoginSuccess) {
      return;
    }

    setIsLoading(true);
    setApiError("");

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await AuthService.signin(formData);

      if (response.success && response.data) {
        
        // Use auth context to login - ensure token exists
        login(response.data.user);
        
        // Store user data and show success modal
        const nextPath = getRedirectPath(response.data.user);
        setRedirectPath(nextPath);
        setIsDashboardReady(false);
        setLoggedInUser(response.data.user);
        setShowLoginSuccess(true);
        void preloadDashboardRoute(nextPath);
      } else {
        // Handle validation errors from backend
        if (response.errors) {
          setErrors(response.errors);
        } else if (response.message) {
          setApiError(response.message);
        }
      }
    } catch (error) {
      console.error("Signin error:", error);
      setApiError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccessModalHide = () => {
    const destination =
      redirectPath || (loggedInUser ? getRedirectPath(loggedInUser) : "/");
    setShowLoginSuccess(false);
    router.replace(destination);
  };

  return (
    <>
      <div className={styles.formContainer}>
        <form
          onSubmit={handleSubmit}
          className={styles.form}
          aria-hidden={showLoginSuccess}
        >
          <h2 className={styles.title}>Welcome Back</h2>

          {successMessage && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              {successMessage}
            </div>
          )}

          {apiError && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              {apiError}
            </div>
          )}

          <div className={styles.inputContainer}>
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

          <div className={styles.passwordContainer}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
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

          <div className={styles.linkSection}>
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
    </>
  );
}
