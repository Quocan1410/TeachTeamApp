"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { getUserInitials } from "@/shared/utils/avatarUtils";
import styles from "./UserDropdown.module.css";

export interface UserDropdownProps {
  user: {
    fullName: string;
    email: string;
    role: string;
    avatarPath?: string;
    avatarNumber?: number;
    firstName?: string;
    lastName?: string;
    hasCustomAvatar?: boolean;
  };
  onSignOut: () => void;
  onToggleDarkMode: () => void;
  isDarkMode: boolean;
  isLoggingOut?: boolean;
}

const UserDropdown: React.FC<UserDropdownProps> = ({
  user,
  onSignOut,
  onToggleDarkMode,
  isDarkMode,
  isLoggingOut = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [user.avatarPath]);

  const showInitials =
    avatarLoadFailed || (!user.hasCustomAvatar && !user.avatarNumber);

  const initials = getUserInitials(
    user.firstName,
    user.lastName,
    user.email
  );

  // Function to get avatar path
  const getAvatarPath = () => {
    if (user.avatarPath) {
      return user.avatarPath;
    } else if (user.avatarNumber) {
      return `/avatars/avatar-${user.avatarNumber}.jpg`;
    } else {
      // Generate a consistent avatar number based on email
      const emailHash = user.email
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);

      // Use lecturer images if user is a lecturer
      if (user.role === "lecturer") {
        return `/lecturers/lecturer-${(emailHash % 4) + 1}.jpg`;
      }

      return `/avatars/avatar-${(emailHash % 12) + 1}.jpg`;
    }
  };

  // Function to get display role
  const getDisplayRole = () => {
    switch (user.role) {
      case "candidate":
        return "Candidate";
      case "lecturer":
        return "Lecturer";
      case "admin":
        return "Admin";
      default:
        return user.role;
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Split name into parts for styling
  const nameParts = user.fullName.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ");

  return (
    <div className={styles.userDropdownContainer} ref={dropdownRef} data-testid="user-dropdown">
      {/* Avatar Button */}
      <div className={styles.avatarButton} onClick={toggleDropdown}>
        <div className={styles.avatarWrapper}>
          <div className={styles.avatarContent}>
            {showInitials ? (
              <span className={styles.avatarInitials}>{initials}</span>
            ) : (
              <Image
                src={getAvatarPath()}
                alt={user.fullName}
                width={40}
                height={40}
                className={styles.avatarImage}
                unoptimized={user.hasCustomAvatar}
                onError={() => setAvatarLoadFailed(true)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={styles.userDropdownMenu}>
          <div className={styles.dropdownHeader}>
            {showInitials ? (
              <div className={styles.dropdownAvatarInitials}>{initials}</div>
            ) : (
            <Image
              src={getAvatarPath()}
              alt={user.fullName}
              width={60}
              height={60}
              className={styles.dropdownAvatar}
              unoptimized={user.hasCustomAvatar}
              onError={() => setAvatarLoadFailed(true)}
            />
            )}
            <div className={styles.userInfo}>
              <h3 className={styles.userName}>
                <span className={styles.firstName}>{firstName}</span>
                {lastName && (
                  <span className={styles.lastName}> {lastName}</span>
                )}
              </h3>
              <p className={styles.userEmail}>{user.email}</p>
              <div className={styles.userRole}>{getDisplayRole()}</div>
            </div>
            <button
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close dropdown"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.closeIcon}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className={styles.dropdownContent}>
            {/* Profile Navigation */}
            <div className={styles.menuSection}>
              <Link
                href="/profile"
                className={styles.menuItem}
                onClick={() => setIsOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={styles.menuIcon}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                View Profile
              </Link>
            </div>

            {/* Actions Row - Dark Mode Toggle and Sign Out on same row */}
            <div className={styles.actionsRow}>
              {/* Theme Toggle */}
              <div className={styles.themeToggleContainer}>
                <div className={styles.themeToggleLabel}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`${styles.themeIcon} ${styles.lightIcon}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`${styles.themeIcon} ${styles.darkIcon}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                </div>

                <div
                  className={`${styles.themeToggle} ${isDarkMode ? styles.active : ""}`}
                  onClick={onToggleDarkMode}
                  aria-label="Toggle dark mode"
                >
                  <div className={styles.toggleHandle}></div>
                </div>
              </div>

              {/* Sign Out Button */}
              <button 
                className={styles.signOutButton} 
                onClick={onSignOut}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <svg className={styles.actionIcon} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="32">
                        <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="1s" repeatCount="indefinite"/>
                        <animate attributeName="strokeDasharray" dur="1s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                    Signing Out...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={styles.actionIcon}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign Out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
