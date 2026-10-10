"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useTheme } from "@/shared/contexts/ThemeContext";
import UserDropdown from "@/shared/components/layout/user-dropdown";
import { hasCustomAvatar } from "@/shared/utils/avatarUtils";
import { getUserDisplayName } from "@/shared/utils/personDisplayName";
import NotificationBell from "@/shared/components/common/notification-bell/NotificationBell";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
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

  const showGuestNav = isLoading || !isAuthenticated;
  const showTutorLink =
    !isLoading && isAuthenticated && user?.userType === "candidate";
  const isLecturerUser =
    !isLoading && isAuthenticated && user?.userType === "lecturer";
  const homeHref =
    !isLoading && user?.userType === "lecturer"
      ? "/lecturer"
      : !isLoading && user?.userType === "candidate"
        ? "/tutor"
        : "/";

  return (
    <header
      className={`${styles["header__main-header"]} ${isScrolled ? styles["header--scrolled"] : ""}`}
    >
      <div className={styles["header__header-container"]}>
        <div className={styles["header__header-grid"]}>
          <div className={styles["header__logo-wrapper"]}>
            <Link href={homeHref} className={styles["header__logo-link"]}>
              <div className={styles["header__logo-container"]}>
                <div className={styles["header__logo-image-container"]}>
                  <Image
                    src="/letter-e.png"
                    alt="duTeam Logo"
                    width={36}
                    height={36}
                    className={styles["header__logo-image"]}
                  />
                </div>
                <span className={styles["header__logo-text"]}>
                  <span className={styles["header__logo-prefix"]}>du</span>Team
                </span>
              </div>
            </Link>
          </div>

          <nav className={styles["header__main-nav"]}>
            <div className={styles["header__nav-links"]}>
                {!user && (
                  <Link
                    href="/"
                    className={`${styles["header__nav-link"]} ${pathname === "/" ? styles["header--active"] : ""}`}
                  >
                    Home
                  </Link>
                )}
                {showGuestNav && (
                  <Link
                    href="/courses"
                    className={`${styles["header__nav-link"]} ${pathname === "/courses" ? styles["header--active"] : ""}`}
                  >
                    Courses
                  </Link>
                )}
                {showTutorLink && (
                  <Link
                    href="/tutor"
                    className={`${styles["header__nav-link"]} ${pathname === "/tutor" ? styles["header--active"] : ""}`}
                  >
                    Candidates
                  </Link>
                )}
                {isAuthenticated && user?.userType === "candidate" && (
                  <Link
                    href="/tutor/applications"
                    className={`${styles["header__nav-link"]} ${pathname.startsWith("/tutor/applications") ? styles["header--active"] : ""}`}
                  >
                    Applications
                  </Link>
                )}
                {isLecturerUser && (
                  <Link
                    href="/lecturer"
                    className={`${styles["header__nav-link"]} ${
                      pathname === "/lecturer" ? styles["header--active"] : ""
                    }`}
                  >
                    Applicants
                  </Link>
                )}
                {showGuestNav && (
                  <Link
                    href="/lecturers"
                    className={`${styles["header__nav-link"]} ${pathname === "/lecturers" ? styles["header--active"] : ""}`}
                  >
                    Lecturers
                  </Link>
                )}
              </div>
          </nav>

          <div className={styles["header__header-actions"]}>
            {(isLoading || !isAuthenticated) && (
              <button
                onClick={toggleDarkMode}
                className={`${styles["header__theme-toggle-btn"]} ${
                  isThemeToggleRemoving
                    ? styles["header--removing"]
                    : isThemeToggleAdding
                      ? styles["header--adding"]
                      : ""
                }`}
                aria-label="Toggle dark mode"
              >
                <div className={styles["header__theme-icon-wrapper"]}>
                  <span className={`${styles["header__theme-icon"]} ${styles["header--sun"]}`}>
                    <SunIcon aria-hidden />
                  </span>
                  <span className={`${styles["header__theme-icon"]} ${styles["header--moon"]}`}>
                    <MoonIcon aria-hidden />
                  </span>
                </div>
              </button>
            )}
            {isAuthenticated && user ? (
              <div className={styles.header__userSection}>
                {(user.userType === "lecturer" ||
                  user.userType === "candidate") && <NotificationBell />}
                <UserDropdown
                  user={{
                    fullName: getUserDisplayName({
                      firstName: user.firstName,
                      lastName: user.lastName,
                      email: user.email,
                      userType: user.userType,
                    }),
                    email: user.email,
                    role: getUserRole(),
                    firstName: user.firstName,
                    lastName: user.lastName,
                    userType: user.userType,
                    avatarUrl: user.avatarUrl,
                    hasCustomAvatar: hasCustomAvatar(user.avatarUrl),
                  }}
                  onSignOut={handleSignOut}
                  onToggleDarkMode={toggleDarkMode}
                  isDarkMode={isDarkMode}
                  isLoggingOut={isLoggingOut}
                />
              </div>
            ) : (
                <div className={styles.header__authButtons}>
                  <Link
                    href="/signin"
                    className={`${styles.header__authButton} ${styles.header__authButtonSecondary} ${pathname === "/signin" ? styles["header--active"] : ""}`}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className={`${styles.header__authButton} ${styles.header__authButtonPrimary} ${pathname === "/signup" ? styles["header--active"] : ""}`}
                  >
                    Sign Up
                  </Link>
                </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);
