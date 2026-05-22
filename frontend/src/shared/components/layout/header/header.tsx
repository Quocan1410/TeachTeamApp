"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useTheme } from "@/shared/contexts/ThemeContext";
import UserDropdown from "../user-dropdown";
import { getUserAvatarSrc } from "@/shared/utils/avatarUtils";
import NotificationBell from "@/shared/components/common/notification-bell/NotificationBell";
import styles from "./header.module.css";

const Header: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoggingOut, isLoading } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isThemeToggleRemoving, setIsThemeToggleRemoving] = useState(false);
  const [isThemeToggleAdding, setIsThemeToggleAdding] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleSignOut = () => {
    if (!isLoggingOut) {
      logout();
    }
    // Remove router.push - let AuthContext handle navigation
  };

  useEffect(() => {
    if (isAuthenticated) {
      setIsThemeToggleRemoving(true);
      setTimeout(() => setIsThemeToggleRemoving(false), 300);
    } else {
      setIsThemeToggleAdding(true);
      setTimeout(() => setIsThemeToggleAdding(false), 300);
    }
  }, [isAuthenticated]);

  // Convert user type to role for compatibility
  const getUserRole = () => {
    if (!user) return "user";
    switch (user.userType) {
      case "candidate":
        return "candidate";
      case "lecturer":
        return "lecturer";
      case "admin":
        return "admin";
      default:
        return "user";
    }
  };

  // Navigation link visibility logic
  // During loading: only show Home (no role-specific links)
  // When not authenticated: show all links
  // When authenticated: show role-appropriate links
  const showTutorLink =
    !isLoading && (!isAuthenticated || user?.userType === "candidate");
  const showLecturerLink =
    !isLoading && (!isAuthenticated || user?.userType === "lecturer");

  return (
    <header
      className={`${styles["main-header"]} ${isScrolled ? styles.scrolled : ""}`}
    >
      <div className={styles["header-container"]}>
        <div className={styles["header-grid"]}>
          <div className={styles["logo-wrapper"]}>
            <Link href="/" className={styles["logo-link"]}>
              <div className={styles["logo-container"]}>
                <div className={styles["logo-image-container"]}>
                  <Image
                    src="/letter-e.png"
                    alt="duTeam Logo"
                    width={45}
                    height={45}
                    className={styles["logo-image"]}
                  />
                </div>
                <span className={styles["logo-text"]}>
                  <span className={styles["logo-prefix"]}>du</span>Team
                </span>
              </div>
            </Link>
          </div>

          <nav className={styles["main-nav"]}>
            {isLoading ? (
              <div className={styles.navLoadingPlaceholder}>
                <div className={styles.navLoadingSpinner}></div>
              </div>
            ) : (
              <div className={styles["nav-links"]}>
                <Link
                  href="/"
                  className={`${styles["nav-link"]} ${pathname === "/" ? styles.active : ""}`}
                >
                  Home
                </Link>
                {showTutorLink && (
                  <Link
                    href="/tutor"
                    className={`${styles["nav-link"]} ${pathname === "/tutor" ? styles.active : ""}`}
                  >
                    Candidates
                  </Link>
                )}
                {showLecturerLink && (
                  <Link
                    href="/lecturer"
                    className={`${styles["nav-link"]} ${pathname === "/lecturer" ? styles.active : ""}`}
                  >
                    Lecturers
                  </Link>
                )}
              </div>
            )}
          </nav>

          <div className={styles["header-actions"]}>
            {!isLoading && !isAuthenticated && (
              <button
                onClick={toggleDarkMode}
                className={`${styles["theme-toggle-btn"]} ${
                  isThemeToggleRemoving
                    ? styles.removing
                    : isThemeToggleAdding
                      ? styles.adding
                      : ""
                }`}
                aria-label="Toggle dark mode"
              >
                <div className={styles["theme-icon-wrapper"]}>
                  <span className={`${styles["theme-icon"]} ${styles.sun}`}>
                    ☀️
                  </span>
                  <span className={`${styles["theme-icon"]} ${styles.moon}`}>
                    🌙
                  </span>
                </div>
              </button>
            )}
            {isAuthenticated && user ? (
              <div className={styles.userSection}>
                {(user.userType === "lecturer" ||
                  user.userType === "candidate") && <NotificationBell />}
                <UserDropdown
                  user={{
                    fullName: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    role: getUserRole(),
                    avatarPath: getUserAvatarSrc(user),
                    firstName: user.firstName,
                    lastName: user.lastName,
                    hasCustomAvatar: !!user.avatarUrl,
                  }}
                  onSignOut={handleSignOut}
                  onToggleDarkMode={toggleDarkMode}
                  isDarkMode={isDarkMode}
                  isLoggingOut={isLoggingOut}
                />
              </div>
            ) : (
              !isLoading && (
                <div className={styles.authButtons}>
                  <Link
                    href="/signin"
                    className={`${styles.authButton} ${styles.authButtonSecondary} ${pathname === "/signin" ? styles.active : ""}`}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className={`${styles.authButton} ${styles.authButtonPrimary} ${pathname === "/signup" ? styles.active : ""}`}
                  >
                    Sign Up
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);
