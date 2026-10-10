"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { getUserInitials } from "@/shared/utils/avatarUtils";
import { getUserDisplayName } from "@/shared/utils/personDisplayName";
import { useProtectedAvatar } from "@/shared/hooks/useProtectedAvatar";
import {
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import styles from "./UserDropdown.module.css";

export interface UserDropdownProps {
  user: {
    fullName: string;
    email: string;
    role: string;
    avatarPath?: string;
    avatarNumber?: number;
    avatarUrl?: string | null;
    firstName?: string;
    lastName?: string;
    userType?: string;
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
  const protectedAvatarUrl = useProtectedAvatar(
    !!user.hasCustomAvatar,
    user.hasCustomAvatar ? user.avatarUrl : null
  );

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [user.avatarPath, user.avatarUrl, protectedAvatarUrl]);

  const showInitials =
    !user.hasCustomAvatar || avatarLoadFailed || !protectedAvatarUrl;

  const initials = getUserInitials(
    user.firstName,
    user.lastName,
    user.email,
    user.fullName
  );

  const avatarImageSrc =
    user.hasCustomAvatar && protectedAvatarUrl ? protectedAvatarUrl : null;

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

  const displayName =
    user.firstName || user.lastName
      ? getUserDisplayName({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType ?? user.role,
        })
      : user.fullName;

  return (
    <div className={styles.userDropdown__userDropdownContainer} ref={dropdownRef} data-testid="user-dropdown">
      {/* Avatar Button */}
      <div className={styles.userDropdown__avatarButton} onClick={toggleDropdown}>
        <div className={styles.userDropdown__avatarWrapper}>
          <div className={styles.userDropdown__avatarContent}>
            {showInitials || !avatarImageSrc ? (
              <span className={styles.userDropdown__avatarInitials}>{initials}</span>
            ) : (
              <Image
                src={avatarImageSrc}
                alt={user.fullName}
                width={40}
                height={40}
                className={styles.userDropdown__avatarImage}
                unoptimized
                onError={() => setAvatarLoadFailed(true)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={styles.userDropdown__userDropdownMenu} role="menu">
          <div className={styles.userDropdown__dropdownHeader}>
            {showInitials || !avatarImageSrc ? (
              <div className={styles.userDropdown__dropdownAvatarInitials}>{initials}</div>
            ) : (
              <Image
                src={avatarImageSrc}
                alt=""
                width={40}
                height={40}
                className={styles.userDropdown__dropdownAvatar}
                unoptimized
                onError={() => setAvatarLoadFailed(true)}
              />
            )}
            <h3 className={styles.userDropdown__userName}>{displayName}</h3>
          </div>

          <div className={styles.userDropdown__dropdownContent}>
            <Link
              href="/profile"
              className={`${styles.userDropdown__menuItem} ${styles["userDropdown__menuItem--settings"]}`}
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <span className={styles.userDropdown__settingsIcon} aria-hidden="true">
                <Cog6ToothIcon className={styles.userDropdown__menuIcon} />
              </span>
              <span>Settings</span>
            </Link>
            <button
              type="button"
              className={`${styles.userDropdown__menuItem} ${styles["userDropdown__menuItem--theme"]}`}
              role="menuitem"
              onClick={onToggleDarkMode}
              aria-label={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
            >
              <span className={styles.userDropdown__themeSlot} aria-hidden="true">
                <SunIcon className={`${styles.userDropdown__menuIcon} ${styles["userDropdown__themeIcon--sun"]}`} />
                <MoonIcon className={`${styles.userDropdown__menuIcon} ${styles["userDropdown__themeIcon--moon"]}`} />
              </span>
              <span>Theme</span>
            </button>
            <button
              type="button"
              className={`${styles.userDropdown__menuItem} ${styles["userDropdown__menuItem--logout"]}`}
              role="menuitem"
              onClick={onSignOut}
              disabled={isLoggingOut}
            >
              <ArrowRightOnRectangleIcon className={styles.userDropdown__menuIcon} aria-hidden="true" />
              <span>{isLoggingOut ? "Logging out…" : "Log out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
