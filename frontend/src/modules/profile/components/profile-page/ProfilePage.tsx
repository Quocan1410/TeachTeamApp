"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AuthService } from "@/shared/services/authService";
import { ApplicationService } from "@/shared/services/applicationService";
import { User, UserType } from "@/shared/types/user";
import { AssignedCourse } from "@/shared/types/courseTypes";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import {
  getUserAvatarSrc,
  getUserInitials,
  hasCustomAvatar,
} from "@/shared/utils/avatarUtils";
import { clearAvatarFetchCache } from "@/shared/utils/avatarFetchCache";
import { useProtectedAvatar } from "@/shared/hooks/useProtectedAvatar";
import { getUserDisplayName, type Honorific } from "@/shared/utils/personDisplayName";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";
import AppSelect from "@/shared/components/common/app-select/AppSelect";
import Toast from "@/shared/components/common/toast/toast";
import { useToast } from "@/shared/hooks/useNotification";
import {
  ArrowUpTrayIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  FingerPrintIcon,
  LockClosedIcon,
  PencilSquareIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { createPasskey, fetchPasskeyStatus } from "@/modules/auth/utils/passkey";
import { availableSkills } from "@/modules/tutor/utils/skillOptions";
import CloseIcon from "@/shared/components/common/icons/CloseIcon";
import styles from "./ProfilePage.module.css";

const AVATAR_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/bmp",
  "image/x-ms-bmp",
]);

function isAllowedAvatarFile(file: File): boolean {
  if (AVATAR_MIME_TYPES.has(file.type)) return true;
  if (file.type && file.type !== "application/octet-stream") return false;
  return /\.(jpe?g|png|webp|gif|avif|bmp)$/i.test(file.name);
}

export const ProfilePage: React.FC = () => {
  const { user: contextUser, updateUser, isLoading: authLoading } = useAuth();
  const contextUserId = contextUser?.id ?? null;
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [assignedCourses, setAssignedCourses] = useState<AssignedCourse[]>([]);
  const [availablePositions, setAvailablePositions] = useState<number>(0);
  const [appliedApplications, setAppliedApplications] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showAvatarInitials, setShowAvatarInitials] = useState(false);
  const [editingSection, setEditingSection] = useState<
    "name" | "description" | "skills" | "website" | null
  >(null);
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [customSkill, setCustomSkill] = useState("");
  const [website, setWebsite] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  );
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [settingsSection, setSettingsSection] = useState<"personal" | "security">("personal");
  const [fullName, setFullName] = useState("");
  const [hasPasskey, setHasPasskey] = useState<boolean | null>(null);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passwordMethod, setPasswordMethod] = useState<"choose" | "current">("choose");
  const [laterMethod, setLaterMethod] = useState<null | "passkey" | "authenticator" | "email">(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    honorific: "Mr." as Honorific,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLElement>(null);
  const contextUserRef = useRef(contextUser);
  contextUserRef.current = contextUser;
  const { toast, showSuccess, showError, hideToast } = useToast();
  const protectedAvatarUrl = useProtectedAvatar(
    !!user && hasCustomAvatar(user.avatarUrl),
    user?.avatarUrl
  );

  useEffect(() => {
    if (authLoading) return;
    if (!contextUser) {
      router.replace("/signin");
      return;
    }
    setUser(contextUser);
    setIsLoading(false);
  }, [authLoading, contextUser, router]);

  useEffect(() => {
    const savedUser = contextUserRef.current;
    if (authLoading || !contextUserId || !savedUser) {
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {

      try {
        if (savedUser.userType === UserType.CANDIDATE) {
          const [profileResponse, coursesResponse, applicationsResponse] =
            await Promise.all([
              AuthService.getProfile(),
              ApplicationService.getCoursesAndRoles(),
              ApplicationService.getMyCandidateApplications(),
            ]);

          if (cancelled) return;

          if (profileResponse.success && profileResponse.data?.user) {
            setUser(profileResponse.data.user);
            updateUser(profileResponse.data.user);
          }

          if (coursesResponse.success && coursesResponse.data) {
            const courses = coursesResponse.data.courses || [];
            const roles = coursesResponse.data.roles || [];
            const applications = applicationsResponse.data || [];

            let availableOpportunities = 0;
            courses.forEach(
              (course: { id: string; courseCode: string; courseName: string }) => {
                roles.forEach((role: { id: string; roleName: string }) => {
                  const hasApplied = applications.some(
                    (app: { courseId: string; roleId: string }) =>
                      app.courseId === course.id && app.roleId === role.id
                  );
                  if (!hasApplied) {
                    availableOpportunities += 1;
                  }
                });
              }
            );

            setAvailablePositions(availableOpportunities);
          }

          if (applicationsResponse.success && applicationsResponse.data) {
            setAppliedApplications(applicationsResponse.data.length || 0);
          }
        } else {
          const profileResponse = await AuthService.getProfile();
          if (cancelled) return;

          if (profileResponse.success && profileResponse.data) {
            setUser(profileResponse.data.user);
            updateUser(profileResponse.data.user);

            if (
              savedUser.userType === UserType.LECTURER &&
              Array.isArray(profileResponse.data.assignedCourses)
            ) {
              setAssignedCourses(profileResponse.data.assignedCourses);
            }
          }
        }
      } catch {
        if (!cancelled) {
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [authLoading, contextUserId, updateUser]);

  const avatarUrl = user?.avatarUrl;

  useEffect(() => {
    if (user) {
      setShowAvatarInitials(!avatarUrl);
    }
  }, [user, avatarUrl]);

  useEffect(() => {
    if (!user) return;
    setFullName(`${user.firstName} ${user.lastName}`.trim());
    setDescription(user.description ?? "");
    setSkills(user.skills ?? "");
    setWebsite(user.website ?? "");
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      honorific:
        (user.honorific as Honorific) ||
        (user.userType === UserType.LECTURER ? "Dr." : "Mr."),
    });
  }, [
    user?.id,
    user?.firstName,
    user?.lastName,
    user?.honorific,
    user?.userType,
    user?.description,
    user?.skills,
    user?.website,
  ]);

  useEffect(() => {
    if (settingsSection !== "security") return;
    let cancelled = false;
    void fetchPasskeyStatus().then((saved) => {
      if (!cancelled) setHasPasskey(saved);
    });
    return () => {
      cancelled = true;
    };
  }, [settingsSection]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAssignedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getUserTypeLabel = (userType: UserType) => {
    switch (userType) {
      case UserType.CANDIDATE:
        return "Candidate";
      case UserType.LECTURER:
        return "Lecturer";
      case UserType.ADMIN:
        return "Admin";
      default:
        return "User";
    }
  };

  const startEditing = (section: "name" | "description" | "skills" | "website") => {
    if (!user) {
      return;
    }
    setFullName(`${user.firstName} ${user.lastName}`.trim());
    setDescription(user.description ?? "");
    setSkills(user.skills ?? "");
    setCustomSkill("");
    setWebsite(user.website ?? "");
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      honorific:
        (user.honorific as Honorific) ||
        (user.userType === UserType.LECTURER ? "Dr." : "Mr."),
    });
    setFieldErrors({});
    setProfileMessage("");
    setEditingSection(section);
    setIsEditingPassword(false);
    resetPasswordForm();
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setFieldErrors({});
    setProfileMessage("");
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
    setPasswordMessage("");
  };

  const startPasswordEditing = () => {
    if (!user) {
      return;
    }
    setEditingSection(null);
    setFieldErrors({});
    setProfileMessage("");
    resetPasswordForm();
    setIsEditingPassword(true);
  };

  const cancelPasswordEditing = () => {
    setIsEditingPassword(false);
    resetPasswordForm();
  };

  const handleSaveProfile = async () => {
    if (!user) {
      return;
    }

    const trimmedName = fullName.trim().replace(/\s+/g, " ");
    const splitAt = trimmedName.indexOf(" ");
    if (splitAt <= 0 || !trimmedName.slice(splitAt + 1).trim()) {
      setFieldErrors({ fullName: "Enter your first and last name." });
      showError("Enter your first and last name.");
      return;
    }

    setIsSaving(true);
    setProfileMessage("");
    setFieldErrors({});

    try {
      const response = await AuthService.updateProfile({
        firstName: trimmedName.slice(0, splitAt),
        lastName: trimmedName.slice(splitAt + 1).trim(),
        honorific: editForm.honorific,
        description,
        skills,
        website,
      });
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        updateUser(response.data.user);
        AuthService.saveUser(response.data.user);
        setEditingSection(null);
        showSuccess("Profile saved successfully.");
      } else if (response.errors) {
        setFieldErrors(response.errors);
        showError("Please fix the errors below.");
      } else {
        showError(response.message || "Failed to save profile.");
      }
    } catch {
      showError("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const clearRejectedPassword = (
    field: "currentPassword" | "newPassword" | "confirmPassword"
  ) => {
    if (!passwordErrors[field]) return;
    setPasswordForm((prev) => ({ ...prev, [field]: "" }));
    setPasswordErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage("");
    setPasswordErrors({});

    try {
      const response = await AuthService.changePassword(passwordForm);
      if (response.success) {
        resetPasswordForm();
        setIsEditingPassword(false);
        showSuccess("Password changed successfully.");
      } else if (response.errors) {
        setPasswordErrors(response.errors);
        showError("Please fix the errors below.");
      } else {
        showError(response.message || "Failed to change password.");
      }
    } catch {
      showError("Failed to change password. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      return;
    }

    if (!isAllowedAvatarFile(file)) {
      showError("Use a JPG, PNG, WebP, GIF, AVIF, or BMP image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showError("Image must be smaller than 2MB.");
      return;
    }

    setAvatarMessage("");
    setIsUploadingAvatar(true);
    setAvatarPreview(URL.createObjectURL(file));
    setShowAvatarInitials(false);

    try {
      const response = await AuthService.uploadAvatar(file);
      if (response.success && response.data?.user) {
        clearAvatarFetchCache();
        setUser(response.data.user);
        updateUser(response.data.user);
        AuthService.saveUser(response.data.user);
        showSuccess("Avatar updated successfully.");
      } else {
        showError(
          response.message ||
            "Upload failed. Sign in again or restart the backend."
        );
        setAvatarPreview(null);
      }
    } catch {
      showError("Upload failed. Check backend is running and try again.");
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatarUrl) {
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarMessage("");

    try {
      const response = await AuthService.deleteAvatar();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        updateUser(response.data.user);
        AuthService.saveUser(response.data.user);
        setAvatarPreview(null);
        setShowAvatarInitials(true);
        showSuccess("Avatar removed.");
      } else {
        showError(response.message || "Failed to remove avatar.");
      }
    } catch {
      showError("Failed to remove avatar. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const avatarSrc =
    avatarPreview ??
    (user && hasCustomAvatar(user.avatarUrl) && protectedAvatarUrl
      ? protectedAvatarUrl
      : user
        ? getUserAvatarSrc(user)
        : "");
  const displayInitials = user
    ? getUserInitials(
        user.firstName,
        user.lastName,
        user.email,
        getUserDisplayName({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType,
        })
      )
    : "?";

  if (authLoading || isLoading) {
    return <PageSkeleton variant="profile" />;
  }

  if (!user) {
    return null;
  }

  const displayName = getUserDisplayName({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    userType: user.userType,
    honorific: user.honorific,
  });
  const savedHonorific =
    (user.honorific as Honorific) ||
    (user.userType === UserType.LECTURER ? "Dr." : "Mr.");
  const savedFullName = `${user.firstName} ${user.lastName}`.trim();
  const profileDirty =
    editingSection === "name"
      ? fullName.trim().replace(/\s+/g, " ") !== savedFullName ||
        editForm.honorific !== savedHonorific
      : editingSection === "description"
        ? description.trim() !== (user.description ?? "").trim()
        : editingSection === "skills"
          ? skills.trim() !== (user.skills ?? "").trim()
          : editingSection === "website"
            ? website.trim() !== (user.website ?? "").trim()
            : false;
  const honorificOptions =
    user.userType === UserType.LECTURER
      ? [
          { value: "Dr.", label: "Dr." },
          { value: "Prof.", label: "Prof." },
        ]
      : [
          { value: "Mr.", label: "Mr." },
          { value: "Ms.", label: "Ms." },
          { value: "Mrs.", label: "Mrs." },
        ];

  const resetAccountForm = () => {
    setFullName(savedFullName);
    setDescription(user.description ?? "");
    setSkills(user.skills ?? "");
    setCustomSkill("");
    setWebsite(user.website ?? "");
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      honorific: savedHonorific,
    });
    setFieldErrors({});
    setProfileMessage("");
    setEditingSection(null);
  };

  const showAccountSection = (section: "personal" | "security") => {
    setSettingsSection(section);
    setLaterMethod(null);
    setPasswordMethod("choose");
  };

  const savePasskey = async () => {
    setPasskeyBusy(true);
    const response = await createPasskey();
    setPasskeyBusy(false);
    if (response.success) {
      setHasPasskey(true);
      showSuccess("Passkey saved.");
      return;
    }
    showError(response.message || "Passkey could not be saved.");
  };

  const selectedSkills = skills
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const addProfileSkill = (value: string) => {
    const next = value.trim().replace(/\s+/g, " ");
    if (!next) return;
    if (next.length < 2) {
      setFieldErrors((prev) => ({ ...prev, skills: "Skills must be at least 2 characters." }));
      return;
    }
    if (!/^[a-zA-Z0-9\s.+#/-]+$/.test(next)) {
      setFieldErrors((prev) => ({ ...prev, skills: "Use letters, numbers, and spaces." }));
      return;
    }
    if (selectedSkills.some((item) => item.toLowerCase() === next.toLowerCase())) {
      setCustomSkill("");
      return;
    }
    if (selectedSkills.length >= 10) {
      setFieldErrors((prev) => ({ ...prev, skills: "You can add up to 10 skills." }));
      return;
    }
    const joined = [...selectedSkills, next].join(", ");
    if (joined.length > 500) {
      setFieldErrors((prev) => ({ ...prev, skills: "Skills must be 500 characters or less." }));
      return;
    }
    setSkills(joined);
    setCustomSkill("");
    setFieldErrors((prev) => ({ ...prev, skills: "" }));
  };

  const removeProfileSkill = (value: string) => {
    setSkills(selectedSkills.filter((item) => item !== value).join(", "));
    setFieldErrors((prev) => ({ ...prev, skills: "" }));
  };

  const fieldEdit = (section: "name" | "description" | "skills" | "website", label: string) => (
    <button
      type="button"
      className={`${styles.profilePage__editIcon} ${
        editingSection === section ? styles["profilePage__editIcon--active"] : ""
      }`}
      onClick={() => (editingSection === section ? resetAccountForm() : startEditing(section))}
      disabled={user.isBlocked || isSaving}
      aria-label={editingSection === section ? `Cancel editing ${label}` : `Edit ${label}`}
      title={`Edit ${label}`}
    >
      <PencilSquareIcon aria-hidden="true" />
    </button>
  );

  const avatarNode = (large: boolean) => (
    <span
      className={`${styles.profilePage__accountAvatar} ${
        large ? styles["profilePage__accountAvatar--large"] : ""
      }`}
    >
      {showAvatarInitials && !user.avatarUrl && !avatarPreview ? (
        <span className={styles.profilePage__accountInitials}>{displayInitials}</span>
      ) : (
        <Image
          src={avatarSrc}
          alt=""
          width={large ? 72 : 40}
          height={large ? 72 : 40}
          className={styles.profilePage__accountAvatarImage}
          unoptimized={!!user.avatarUrl || !!avatarPreview}
          onError={() => setShowAvatarInitials(true)}
        />
      )}
    </span>
  );

  return (
    <div className={styles.profilePage__profileContainer}>
      <div className={styles.profilePage__accountShell}>
        <aside className={styles.profilePage__accountSide} aria-label="Settings">
          <div className={styles.profilePage__accountIdentity}>
            {avatarNode(true)}
            <span className={styles.profilePage__accountIdentityCopy}>
              <span className={styles.profilePage__accountIdentityName}>{displayName}</span>
              <span className={styles.profilePage__accountIdentityRole}>
                {getUserTypeLabel(user.userType)}
              </span>
            </span>
          </div>
          <p className={styles.profilePage__accountGroup}>Your account</p>
          <button
            type="button"
            className={`${styles.profilePage__accountNavItem} ${
              settingsSection === "personal" ? styles["profilePage__accountNavItem--active"] : ""
            }`}
            onClick={() => showAccountSection("personal")}
          >
            <UserIcon className={styles.profilePage__accountNavIcon} aria-hidden="true" />
            Profile
          </button>
          <button
            type="button"
            className={`${styles.profilePage__accountNavItem} ${
              settingsSection === "security" ? styles["profilePage__accountNavItem--active"] : ""
            }`}
            onClick={() => showAccountSection("security")}
          >
            <LockClosedIcon className={styles.profilePage__accountNavIcon} aria-hidden="true" />
            Login & security
          </button>
        </aside>

        <section className={styles.profilePage__accountMain} ref={accountRef}>
          <header className={styles.profilePage__accountHeader}>
            <h1 className={styles.profilePage__accountTitle}>
              {settingsSection === "personal" ? "Profile" : "Login & security"}
            </h1>
            {settingsSection === "personal" && (
              <p className={styles.profilePage__accountMeta}>
                {getUserTypeLabel(user.userType)} · Joined {formatDate(user.createdAt)}
              </p>
            )}
          </header>

          {settingsSection === "personal" ? (
            <>
          <div className={styles.profilePage__editBlock}>
          <div className={styles.profilePage__pictureRow}>
            {avatarNode(true)}
            <div className={styles.profilePage__pictureCopy}>
              <h2 className={styles.profilePage__pictureTitle}>Profile picture</h2>
              <div className={styles.profilePage__pictureActions}>
                <button
                  type="button"
                  className={styles.profilePage__uploadButton}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar || user.isBlocked}
                >
                  <ArrowUpTrayIcon className={styles.profilePage__uploadIcon} aria-hidden="true" />
                  {isUploadingAvatar ? "Uploading..." : "Upload image"}
                </button>
                <button
                  type="button"
                  className={styles.profilePage__removeButton}
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar || !user.avatarUrl}
                >
                  Remove
                </button>
              </div>
              <p className={styles.profilePage__pictureHint}>
                JPG, PNG, WebP, GIF, AVIF or BMP under 2MB
              </p>
              {avatarMessage && (
                <p
                  className={`${styles.profilePage__avatarMessage} ${
                    avatarMessage.toLowerCase().includes("success") ||
                    avatarMessage.toLowerCase().includes("removed")
                      ? styles.profilePage__avatarMessageSuccess
                      : styles.profilePage__avatarMessageError
                  }`}
                >
                  {avatarMessage}
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp"
              className={styles.profilePage__avatarFileInput}
              onChange={handleAvatarFileChange}
            />
          </div>
          </div>

          <div className={styles.profilePage__editBlock}>
          <div className={styles.profilePage__nameRow}>
            <div className={styles.profilePage__field}>
              <span className={styles.profilePage__fieldHead}>
                <label className={styles.profilePage__fieldLabel} htmlFor="profile-full-name">
                  Full name
                </label>
                {fieldEdit("name", "full name")}
              </span>
              <input
                id="profile-full-name"
                type="text"
                className={`${styles.profilePage__accountInput} ${
                  fieldErrors.fullName ? styles.profilePage__formInputError : ""
                }`}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={editingSection !== "name" || isSaving || user.isBlocked}
                autoComplete="name"
              />
              {fieldErrors.fullName && (
                <span className={styles.profilePage__fieldError}>{fieldErrors.fullName}</span>
              )}
            </div>
            <div className={styles.profilePage__field}>
              <span className={styles.profilePage__fieldHead}>
                <label className={styles.profilePage__fieldLabel} htmlFor="profile-honorific">
                  Title
                </label>
                {fieldEdit("name", "title")}
              </span>
              <AppSelect
                id="profile-honorific"
                className={styles.profilePage__titleSelect}
                value={editForm.honorific}
                onChange={(value) =>
                  setEditForm((prev) => ({ ...prev, honorific: value as Honorific }))
                }
                options={honorificOptions}
                hasError={!!fieldErrors.honorific}
                disabled={editingSection !== "name" || isSaving || user.isBlocked}
                aria-label="Title"
              />
              {fieldErrors.honorific && (
                <span className={styles.profilePage__fieldError}>{fieldErrors.honorific}</span>
              )}
            </div>
          </div>
          {editingSection === "name" && (
            <div className={styles.profilePage__sectionActions}>
              <button
                type="button"
                className={styles.profilePage__ghostButton}
                onClick={resetAccountForm}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.profilePage__primaryButton}
                onClick={handleSaveProfile}
                disabled={!profileDirty || isSaving || user.isBlocked}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
          </div>

          <div className={styles.profilePage__editBlock}>
            <label className={styles.profilePage__field} htmlFor="profile-email">
              <span className={styles.profilePage__fieldHead}>
                <span className={styles.profilePage__fieldLabel}>Email</span>
              </span>
              <input
                id="profile-email"
                type="email"
                className={styles.profilePage__accountInput}
                value={user.email}
                readOnly
                disabled
              />
              <span className={styles.profilePage__fieldHint}>Used to sign in to your account</span>
            </label>
          </div>

          <div className={styles.profilePage__editBlock}>
            <div className={styles.profilePage__field}>
              <span className={styles.profilePage__fieldHead}>
                <label className={styles.profilePage__fieldLabel} htmlFor="profile-description">
                  Description
                </label>
                {fieldEdit("description", "description")}
              </span>
              <textarea
                id="profile-description"
                className={`${styles.profilePage__accountInput} ${styles.profilePage__accountTextarea}`}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={editingSection !== "description" || isSaving || user.isBlocked}
                placeholder="Tell people a little about yourself"
                rows={4}
                maxLength={1000}
              />
              {fieldErrors.description && (
                <span className={styles.profilePage__fieldError}>{fieldErrors.description}</span>
              )}
            </div>
            {editingSection === "description" && (
              <div className={styles.profilePage__sectionActions}>
                <button type="button" className={styles.profilePage__ghostButton} onClick={resetAccountForm} disabled={isSaving}>
                  Cancel
                </button>
                <button type="button" className={styles.profilePage__primaryButton} onClick={handleSaveProfile} disabled={!profileDirty || isSaving || user.isBlocked}>
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          <div className={styles.profilePage__editBlock}>
            <div className={styles.profilePage__field}>
              <span className={styles.profilePage__fieldHead}>
                <span className={styles.profilePage__fieldLabel}>Skills</span>
                {fieldEdit("skills", "skills")}
              </span>
              {editingSection === "skills" ? (
                <div className={styles.profilePage__skillsPanel}>
                  {selectedSkills.length > 0 && (
                    <div className={styles.profilePage__skillsSelected}>
                      <span className={styles.profilePage__skillsLabel}>
                        Selected{" "}
                        <span className={styles.profilePage__skillsCount}>
                          {selectedSkills.length}/10
                        </span>
                      </span>
                      <div className={styles.profilePage__skillTags}>
                        {selectedSkills.map((skill) => (
                          <span key={skill} className={styles.profilePage__skillTag}>
                            {skill}
                            <button
                              type="button"
                              className={styles.profilePage__skillRemove}
                              onClick={() => removeProfileSkill(skill)}
                              aria-label={`Remove ${skill}`}
                            >
                              <CloseIcon size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <span className={styles.profilePage__skillsLabel}>Suggested skills</span>
                  <div className={styles.profilePage__skillGrid}>
                    {availableSkills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        className={`${styles.profilePage__skillChip} ${
                          selectedSkills.includes(skill) ? styles["profilePage__skillChip--active"] : ""
                        }`}
                        onClick={() => addProfileSkill(skill)}
                        disabled={
                          selectedSkills.includes(skill) ||
                          selectedSkills.length >= 10 ||
                          isSaving ||
                          user.isBlocked
                        }
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                  <div className={styles.profilePage__skillAddRow}>
                    <input
                      type="text"
                      value={customSkill}
                      onChange={(event) => setCustomSkill(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addProfileSkill(customSkill);
                        }
                      }}
                      placeholder="Add a custom skill…"
                      className={styles.profilePage__skillAddInput}
                      disabled={selectedSkills.length >= 10 || isSaving || user.isBlocked}
                    />
                    <button
                      type="button"
                      className={styles.profilePage__skillAddButton}
                      onClick={() => addProfileSkill(customSkill)}
                      disabled={
                        !customSkill.trim() ||
                        selectedSkills.length >= 10 ||
                        isSaving ||
                        user.isBlocked
                      }
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : selectedSkills.length > 0 ? (
                <div className={styles.profilePage__skillTags}>
                  {selectedSkills.map((skill) => (
                    <span key={skill} className={styles.profilePage__skillTag}>
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className={styles.profilePage__skillsEmpty}>No skills yet</p>
              )}
              {fieldErrors.skills && (
                <span className={styles.profilePage__fieldError}>{fieldErrors.skills}</span>
              )}
            </div>
            {editingSection === "skills" && (
              <div className={styles.profilePage__sectionActions}>
                <button type="button" className={styles.profilePage__ghostButton} onClick={resetAccountForm} disabled={isSaving}>
                  Cancel
                </button>
                <button type="button" className={styles.profilePage__primaryButton} onClick={handleSaveProfile} disabled={!profileDirty || isSaving || user.isBlocked}>
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          <div className={styles.profilePage__editBlock}>
            <div className={styles.profilePage__field}>
              <span className={styles.profilePage__fieldHead}>
                <label className={styles.profilePage__fieldLabel} htmlFor="profile-website">
                  Website
                </label>
                {fieldEdit("website", "website")}
              </span>
              <input
                id="profile-website"
                type="text"
                className={`${styles.profilePage__accountInput} ${
                  fieldErrors.website ? styles.profilePage__formInputError : ""
                }`}
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                disabled={editingSection !== "website" || isSaving || user.isBlocked}
                placeholder="https://example.com"
                autoComplete="url"
              />
              {fieldErrors.website && (
                <span className={styles.profilePage__fieldError}>{fieldErrors.website}</span>
              )}
            </div>
            {editingSection === "website" && (
              <div className={styles.profilePage__sectionActions}>
                <button type="button" className={styles.profilePage__ghostButton} onClick={resetAccountForm} disabled={isSaving}>
                  Cancel
                </button>
                <button type="button" className={styles.profilePage__primaryButton} onClick={handleSaveProfile} disabled={!profileDirty || isSaving || user.isBlocked}>
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>
            </>
          ) : (
            <div className={styles.profilePage__securityPage}>
              <section className={styles.profilePage__securityBlock}>
                <h2 className={styles.profilePage__passwordTitle}>Sign-in methods</h2>
                <p className={styles.profilePage__passwordText}>
                  See what this account can use to sign in.
                </p>
                <div className={styles.profilePage__methodList}>
                  <div className={styles.profilePage__methodRow}>
                    <span className={styles.profilePage__methodIcon} aria-hidden="true">
                      <FingerPrintIcon />
                    </span>
                    <span className={styles.profilePage__methodCopy}>
                      <span className={styles.profilePage__methodTitle}>Passkey</span>
                      <span className={styles.profilePage__methodHint}>
                        {hasPasskey ? "Set up on this account" : "Not set up yet"}
                      </span>
                    </span>
                    {hasPasskey ? (
                      <span className={styles.profilePage__methodBadge}>Active</span>
                    ) : (
                      <button
                        type="button"
                        className={styles.profilePage__changePassword}
                        onClick={savePasskey}
                        disabled={passkeyBusy || user.isBlocked || hasPasskey === null}
                      >
                        {passkeyBusy ? "Waiting…" : "Set up"}
                      </button>
                    )}
                  </div>
                  <div className={styles.profilePage__methodRow}>
                    <span className={styles.profilePage__methodIcon} aria-hidden="true">
                      <DevicePhoneMobileIcon />
                    </span>
                    <span className={styles.profilePage__methodCopy}>
                      <span className={styles.profilePage__methodTitle}>Authenticator</span>
                      <span className={styles.profilePage__methodHint}>Not set up yet</span>
                    </span>
                    <button
                      type="button"
                      className={styles.profilePage__changePassword}
                      onClick={() => setLaterMethod("authenticator")}
                    >
                      Set up
                    </button>
                  </div>
                </div>
              </section>

              <section className={styles.profilePage__securityBlock}>
                <h2 className={styles.profilePage__passwordTitle}>Change password</h2>
                <p className={styles.profilePage__passwordText}>
                  Confirm it is you, then choose a new password. The current password is required for that method.
                </p>
                {laterMethod ? (
                  <div className={styles.profilePage__laterPanel}>
                    <h3 className={styles.profilePage__laterTitle}>Sorry</h3>
                    <p className={styles.profilePage__passwordText}>
                      This feature will be implemented later.
                    </p>
                    <button
                      type="button"
                      className={styles.profilePage__laterBack}
                      onClick={() => setLaterMethod(null)}
                    >
                      ← Back
                    </button>
                  </div>
                ) : passwordMethod === "current" ? (
                  <form
                    id="profile-change-password-form"
                    onSubmit={handleChangePassword}
                    className={styles.profilePage__passwordFields}
                  >
                    <label className={styles.profilePage__field} htmlFor="currentPassword">
                      <span className={styles.profilePage__fieldLabel}>Current password</span>
                      <input
                        id="currentPassword"
                        type="password"
                        className={`${styles.profilePage__accountInput} ${
                          passwordErrors.currentPassword ? styles.profilePage__formInputError : ""
                        }`}
                        value={passwordForm.currentPassword}
                        onFocus={() => clearRejectedPassword("currentPassword")}
                        onClick={() => clearRejectedPassword("currentPassword")}
                        onChange={(event) =>
                          setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                        }
                        autoComplete="current-password"
                        required
                        disabled={isChangingPassword}
                      />
                      {passwordErrors.currentPassword && (
                        <span className={styles.profilePage__fieldError}>{passwordErrors.currentPassword}</span>
                      )}
                    </label>
                    <label className={styles.profilePage__field} htmlFor="newPassword">
                      <span className={styles.profilePage__fieldLabel}>New password</span>
                      <input
                        id="newPassword"
                        type="password"
                        className={`${styles.profilePage__accountInput} ${
                          passwordErrors.newPassword ? styles.profilePage__formInputError : ""
                        }`}
                        value={passwordForm.newPassword}
                        onFocus={() => clearRejectedPassword("newPassword")}
                        onClick={() => clearRejectedPassword("newPassword")}
                        onChange={(event) =>
                          setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
                        }
                        autoComplete="new-password"
                        required
                        disabled={isChangingPassword}
                      />
                      {passwordErrors.newPassword && (
                        <span className={styles.profilePage__fieldError}>{passwordErrors.newPassword}</span>
                      )}
                    </label>
                    <label className={styles.profilePage__field} htmlFor="confirmPassword">
                      <span className={styles.profilePage__fieldLabel}>Confirm new password</span>
                      <input
                        id="confirmPassword"
                        type="password"
                        className={`${styles.profilePage__accountInput} ${
                          passwordErrors.confirmPassword ? styles.profilePage__formInputError : ""
                        }`}
                        value={passwordForm.confirmPassword}
                        onFocus={() => clearRejectedPassword("confirmPassword")}
                        onClick={() => clearRejectedPassword("confirmPassword")}
                        onChange={(event) =>
                          setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                        }
                        autoComplete="new-password"
                        required
                        disabled={isChangingPassword}
                      />
                      {passwordErrors.confirmPassword && (
                        <span className={styles.profilePage__fieldError}>{passwordErrors.confirmPassword}</span>
                      )}
                    </label>
                    <div className={styles.profilePage__passwordActions}>
                      <button
                        type="button"
                        className={styles.profilePage__ghostButton}
                        onClick={() => {
                          cancelPasswordEditing();
                          setPasswordMethod("choose");
                        }}
                        disabled={isChangingPassword}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={styles.profilePage__primaryButton}
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? "Updating..." : "Update password"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className={styles.profilePage__methodList}>
                    <button
                      type="button"
                      className={styles.profilePage__methodRow}
                      onClick={() => {
                        setLaterMethod(null);
                        startPasswordEditing();
                        setPasswordMethod("current");
                      }}
                      disabled={user.isBlocked}
                    >
                      <span className={styles.profilePage__methodIcon} aria-hidden="true">
                        <LockClosedIcon />
                      </span>
                      <span className={styles.profilePage__methodCopy}>
                        <span className={styles.profilePage__methodTitle}>Current password</span>
                        <span className={styles.profilePage__methodHint}>Confirm with the password you use now</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={styles.profilePage__methodRow}
                      onClick={() => setLaterMethod("passkey")}
                    >
                      <span className={styles.profilePage__methodIcon} aria-hidden="true">
                        <FingerPrintIcon />
                      </span>
                      <span className={styles.profilePage__methodCopy}>
                        <span className={styles.profilePage__methodTitle}>Passkey</span>
                        <span className={styles.profilePage__methodHint}>
                          {hasPasskey ? "Use the passkey on this account" : "Set up a passkey first"}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={styles.profilePage__methodRow}
                      onClick={() => setLaterMethod("authenticator")}
                    >
                      <span className={styles.profilePage__methodIcon} aria-hidden="true">
                        <DevicePhoneMobileIcon />
                      </span>
                      <span className={styles.profilePage__methodCopy}>
                        <span className={styles.profilePage__methodTitle}>Authenticator</span>
                        <span className={styles.profilePage__methodHint}>One-time code from an authenticator app</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={styles.profilePage__methodRow}
                      onClick={() => setLaterMethod("email")}
                    >
                      <span className={styles.profilePage__methodIcon} aria-hidden="true">
                        <EnvelopeIcon />
                      </span>
                      <span className={styles.profilePage__methodCopy}>
                        <span className={styles.profilePage__methodTitle}>Email</span>
                        <span className={styles.profilePage__methodHint}>A code sent to your school email</span>
                      </span>
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}
        </section>
      </div>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />
    </div>
  );
};
