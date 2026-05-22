"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
    deleteAdminAvatar,
    uploadAdminAvatar,
} from "@/lib/avatarService";
import { getUserInitials, hasCustomAvatar } from "@/lib/avatarUtils";
import { useProtectedAvatar } from "@/hooks/useProtectedAvatar";
import styles from "./profile.module.css";

export default function AdminProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [avatarMessage, setAvatarMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const protectedAvatarUrl = useProtectedAvatar(
        hasCustomAvatar(user?.avatarUrl),
        user?.avatarUrl
    );

    useEffect(() => {
        const userData = localStorage.getItem("admin-user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const persistUser = (updatedUser: any) => {
        const mergedUser = {
            ...user,
            ...updatedUser,
            fullName:
                updatedUser.fullName ||
                `${updatedUser.firstName} ${updatedUser.lastName}`,
        };
        setUser(mergedUser);
        localStorage.setItem("admin-user", JSON.stringify(mergedUser));
        window.dispatchEvent(new Event("admin-user-updated"));
    };

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setAvatarMessage("Please upload a JPEG, PNG, or WebP image.");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setAvatarMessage("Image must be smaller than 2MB.");
            return;
        }

        setIsUploading(true);
        setAvatarMessage("");
        setAvatarPreview(URL.createObjectURL(file));

        try {
            const response = await uploadAdminAvatar(file);
            if (response.success && response.data?.user) {
                persistUser(response.data.user);
                setAvatarMessage("Avatar updated successfully.");
            } else {
                setAvatarMessage(response.message || "Failed to upload avatar.");
                setAvatarPreview(null);
            }
        } catch {
            setAvatarMessage("Failed to upload avatar.");
            setAvatarPreview(null);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemoveAvatar = async () => {
        if (!user?.avatarUrl) {
            return;
        }

        setIsUploading(true);
        setAvatarMessage("");

        try {
            const response = await deleteAdminAvatar();
            if (response.success && response.data?.user) {
                persistUser(response.data.user);
                setAvatarPreview(null);
                setAvatarMessage("Avatar removed.");
            } else {
                setAvatarMessage(response.message || "Failed to remove avatar.");
            }
        } catch {
            setAvatarMessage("Failed to remove avatar.");
        } finally {
            setIsUploading(false);
        }
    };

    if (!user) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
                <p>Loading profile...</p>
            </div>
        );
    }

    const avatarSrc =
        avatarPreview ||
        (hasCustomAvatar(user.avatarUrl) ? protectedAvatarUrl : null);
    const initials = getUserInitials(
        user.firstName,
        user.lastName,
        user.email
    );
    const isSuccessMessage =
        avatarMessage.toLowerCase().includes("success") ||
        avatarMessage.toLowerCase().includes("removed");

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Profile</h1>
                    <p className={styles.subtitle}>
                        Manage your admin account photo.
                    </p>
                </header>

                <div className={styles.profileBody}>
                    <button
                        type="button"
                        className={styles.avatarTrigger}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        aria-label="Change profile photo"
                    >
                        <div className={styles.avatarRing}>
                            {avatarSrc ? (
                                <Image
                                    src={avatarSrc}
                                    alt="Admin avatar"
                                    width={112}
                                    height={112}
                                    className={styles.avatarImage}
                                    unoptimized
                                />
                            ) : (
                                <span className={styles.avatarInitials}>
                                    {initials}
                                </span>
                            )}
                            <span className={styles.avatarOverlay} aria-hidden="true">
                                {isUploading ? (
                                    <span className={styles.overlaySpinner} />
                                ) : (
                                    <>
                                        <svg
                                            className={styles.overlayIcon}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                            <circle cx="12" cy="13" r="4" />
                                        </svg>
                                        <span className={styles.overlayText}>
                                            Change photo
                                        </span>
                                    </>
                                )}
                            </span>
                        </div>
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className={styles.hiddenInput}
                        onChange={handleFileChange}
                    />

                    <div className={styles.identity}>
                        <h2>
                            {user.fullName ||
                                `${user.firstName} ${user.lastName}`}
                        </h2>
                        <p>{user.email}</p>
                        <span className={styles.roleBadge}>Administrator</span>
                    </div>

                    <div className={styles.meta}>
                        {user.avatarUrl && (
                            <button
                                type="button"
                                className={styles.removeLink}
                                onClick={handleRemoveAvatar}
                                disabled={isUploading}
                            >
                                Remove photo
                            </button>
                        )}
                        {avatarMessage && (
                            <p
                                className={`${styles.message} ${
                                    isSuccessMessage
                                        ? styles.messageSuccess
                                        : styles.messageError
                                }`}
                            >
                                {avatarMessage}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
