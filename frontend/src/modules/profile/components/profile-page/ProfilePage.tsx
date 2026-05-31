"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AuthService } from "../../../../shared/services/authService";
import { ApplicationService } from "../../../../shared/services/applicationService";
import { User, UserType } from "../../../../shared/types/user";
import { AssignedCourse } from "../../../../shared/types/courseTypes";
import { useAuth } from "../../../auth/hooks/useAuth";
import {
  getUserAvatarSrc,
  getUserInitials,
  hasCustomAvatar,
} from "../../../../shared/utils/avatarUtils";
import { clearAvatarFetchCache } from "../../../../shared/utils/avatarFetchCache";
import { useProtectedAvatar } from "../../../../shared/hooks/useProtectedAvatar";
import { getUserDisplayName, type Honorific } from "@/shared/utils/personDisplayName";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";
import styles from "./ProfilePage.module.css";

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
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    honorific: "Mr." as Honorific,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const protectedAvatarUrl = useProtectedAvatar(
    !!user && hasCustomAvatar(user.avatarUrl),
    user?.avatarUrl
  );

  useEffect(() => {
    if (authLoading) return;
    const savedUser = contextUser || AuthService.getUser();
    if (!savedUser) {
      router.replace("/signin");
    }
  }, [authLoading, contextUserId, contextUser, router]);

  useEffect(() => {
    if (authLoading || !contextUserId) {
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      const savedUser = AuthService.getUser();
      if (!savedUser || savedUser.id !== contextUserId) {
        return;
      }

      setUser(savedUser);

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
              (course: { id: number; courseCode: string; courseName: string }) => {
                roles.forEach((role: { id: number; roleName: string }) => {
                  const hasApplied = applications.some(
                    (app: { courseId: number; roleId: number }) =>
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
      } catch (apiError) {
        if (!cancelled) {
          console.error("Failed to load profile data:", apiError);
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

  const startEditing = () => {
    if (!user) {
      return;
    }
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      honorific:
        (user.honorific as Honorific) ||
        (user.userType === UserType.LECTURER ? "Dr." : "Mr."),
    });
    setFieldErrors({});
    setProfileMessage("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setFieldErrors({});
    setProfileMessage("");
  };

  const handleSaveProfile = async () => {
    if (!user) {
      return;
    }

    setIsSaving(true);
    setProfileMessage("");
    setFieldErrors({});

    try {
      const response = await AuthService.updateProfile(editForm);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        updateUser(response.data.user);
        AuthService.saveUser(response.data.user);
        setIsEditing(false);
        setProfileMessage("Profile saved successfully.");
      } else if (response.errors) {
        setFieldErrors(response.errors);
        setProfileMessage("Please fix the errors below.");
      } else {
        setProfileMessage(response.message || "Failed to save profile.");
      }
    } catch {
      setProfileMessage("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
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
        setAvatarMessage("Avatar updated successfully.");
      } else {
        setAvatarMessage(
          response.message ||
            "Upload failed. Sign in again or restart the backend."
        );
        setAvatarPreview(null);
      }
    } catch {
      setAvatarMessage(
        "Upload failed. Check backend is running and try again."
      );
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
        setAvatarMessage("Avatar removed.");
      } else {
        setAvatarMessage(response.message || "Failed to remove avatar.");
      }
    } catch {
      setAvatarMessage("Failed to remove avatar. Please try again.");
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

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileGrid}>
        {/* Left Panel - User Information */}
        <div className={styles.userPanel}>
          <div className={styles.avatarSection}>
            <button
              type="button"
              className={styles.avatarTrigger}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              aria-label="Change profile photo"
            >
              <div className={styles.avatarRing}>
                {showAvatarInitials && !user.avatarUrl && !avatarPreview ? (
                  <span className={styles.avatarInitials}>{displayInitials}</span>
                ) : (
                  <Image
                    src={avatarSrc}
                    alt={`${getUserDisplayName({
                      firstName: user.firstName,
                      lastName: user.lastName,
                      email: user.email,
                      userType: user.userType,
                    })} avatar`}
                    width={112}
                    height={112}
                    className={styles.avatarImage}
                    unoptimized={!!user.avatarUrl || !!avatarPreview}
                    onError={() => setShowAvatarInitials(true)}
                  />
                )}
                <span className={styles.avatarOverlay} aria-hidden="true">
                  {isUploadingAvatar ? (
                    <span className={styles.avatarOverlaySpinner} />
                  ) : (
                    <>
                      <svg
                        className={styles.avatarOverlayIcon}
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
                      <span className={styles.avatarOverlayText}>
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
              className={styles.avatarFileInput}
              onChange={handleAvatarFileChange}
            />

            <div className={styles.avatarMeta}>
              {user.avatarUrl && (
                <button
                  type="button"
                  className={styles.removeAvatarLink}
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                >
                  Remove photo
                </button>
              )}
              {avatarMessage && (
                <p
                  className={`${styles.avatarMessage} ${
                    avatarMessage.toLowerCase().includes("success") ||
                    avatarMessage.toLowerCase().includes("removed")
                      ? styles.avatarMessageSuccess
                      : styles.avatarMessageError
                  }`}
                >
                  {avatarMessage}
                </p>
              )}
            </div>
          </div>

          <div className={styles.userInfo}>
            <h1 className={styles.userName}>
              {getUserDisplayName({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                userType: user.userType,
                honorific: user.honorific,
              })}
            </h1>
            <div className={styles.userRole}>
              <span className={`${styles.roleBadge} ${styles[user.userType]}`}>
                {getUserTypeLabel(user.userType)}
              </span>
            </div>
            <p className={styles.userEmail}>{user.email}</p>
          </div>

          <div className={styles.quickStats}>
            <div className={styles.statCard}>
              <div className={styles.statIconWrapper}>
                <div className={styles.statIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>MEMBER SINCE</span>
                <span className={styles.statValue}>
                  {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconWrapper}>
                <div className={`${styles.statIcon} ${user.isBlocked ? styles.statusBlocked : styles.statusActive}`}>
                  {user.isBlocked ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                  )}
                </div>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>STATUS</span>
                <span
                  className={`${styles.statusBadge} ${user.isBlocked ? styles.blocked : styles.active}`}
                >
                  {user.isBlocked ? "Blocked" : "Active"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Information Cards */}
        <div className={styles.infoPanel}>
          {/* Account Information */}
          <div className={styles.infoCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Account Information</h3>
              <div className={styles.cardHeaderActions}>
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={cancelEditing}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={styles.saveButton}
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={startEditing}
                    disabled={user.isBlocked}
                    title={
                      user.isBlocked
                        ? "Blocked accounts cannot edit their profile"
                        : "Edit profile"
                    }
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
            <div className={styles.cardContent}>
              {profileMessage && (
                <p
                  className={`${styles.profileMessage} ${
                    profileMessage.toLowerCase().includes("success")
                      ? styles.profileMessageSuccess
                      : styles.profileMessageError
                  }`}
                >
                  {profileMessage}
                </p>
              )}
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Account Type</span>
                  <span className={styles.infoValue}>
                    {getUserTypeLabel(user.userType)}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Join Date</span>
                  <span className={styles.infoValue}>
                    {formatDate(user.createdAt)}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel} htmlFor="profile-first-name">
                    First Name
                  </label>
                  {isEditing ? (
                    <>
                      <input
                        id="profile-first-name"
                        type="text"
                        className={`${styles.formInput} ${
                          fieldErrors.firstName ? styles.formInputError : ""
                        }`}
                        value={editForm.firstName}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        disabled={isSaving}
                        autoComplete="given-name"
                      />
                      {fieldErrors.firstName && (
                        <span className={styles.fieldError}>
                          {fieldErrors.firstName}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className={styles.infoValue}>{user.firstName}</span>
                  )}
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel} htmlFor="profile-last-name">
                    Last Name
                  </label>
                  {isEditing ? (
                    <>
                      <input
                        id="profile-last-name"
                        type="text"
                        className={`${styles.formInput} ${
                          fieldErrors.lastName ? styles.formInputError : ""
                        }`}
                        value={editForm.lastName}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        disabled={isSaving}
                        autoComplete="family-name"
                      />
                      {fieldErrors.lastName && (
                        <span className={styles.fieldError}>
                          {fieldErrors.lastName}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className={styles.infoValue}>{user.lastName}</span>
                  )}
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Title</span>
                  {isEditing ? (
                    <>
                      <select
                        id="profile-honorific"
                        className={`${styles.formInput} ${
                          fieldErrors.honorific ? styles.formInputError : ""
                        }`}
                        value={editForm.honorific}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            honorific: e.target.value as Honorific,
                          }))
                        }
                        disabled={isSaving}
                        aria-label="Title"
                      >
                        {user.userType === UserType.LECTURER ? (
                          <>
                            <option value="Dr.">Dr.</option>
                            <option value="Prof.">Prof.</option>
                          </>
                        ) : (
                          <>
                            <option value="Mr.">Mr.</option>
                            <option value="Ms.">Ms.</option>
                            <option value="Mrs.">Mrs.</option>
                          </>
                        )}
                      </select>
                      {fieldErrors.honorific && (
                        <span className={styles.fieldError}>
                          {fieldErrors.honorific}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className={styles.infoValue}>
                      {user.honorific ||
                        (user.userType === UserType.LECTURER ? "Dr." : "Mr.")}
                    </span>
                  )}
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>{user.email}</span>
                  {isEditing && (
                    <span className={styles.fieldHint}>
                      Email cannot be changed.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Role-Specific Information */}
          <div className={styles.infoCardExpandable}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                {user.userType === UserType.LECTURER
                  ? "Assigned Courses"
                  : "Role Details"}
              </h3>
              {user.userType === UserType.LECTURER && assignedCourses.length > 0 && (
                <p className={styles.courseCount}>
                  You are currently assigned to {assignedCourses.length}{" "}
                  course{assignedCourses.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className={styles.cardContentExpandable}>
              {user.userType === UserType.LECTURER ? (
                <>
                  {assignedCourses.length > 0 ? (
                    <>
                      <div className={styles.courseList}>
                        {assignedCourses.map((course) => (
                          <div key={course.id} className={styles.courseItem}>
                            <div className={styles.courseInfo}>
                              <div className={styles.courseCode}>
                                {course.courseCode}
                              </div>
                              <div className={styles.courseName}>
                                {course.courseName}
                              </div>
                              <div className={styles.courseSemester}>
                                {course.semester}
                              </div>
                            </div>
                            <div className={styles.courseDate}>
                              <span className={styles.courseAssignedLabel}>
                                Assigned
                              </span>
                              <span className={styles.courseAssignedDate}>
                                {formatAssignedDate(
                                  course.assignedAt.toString()
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className={styles.emptyCourses}>
                      <div className={styles.emptyCoursesIcon}>📚</div>
                      <div className={styles.emptyCoursesTitle}>
                        No Courses Assigned
                      </div>
                      <div className={styles.emptyCoursesText}>
                        You haven&apos;t been assigned to any courses yet.
                        <br />
                        Please contact the administrator to request course
                        assignments.
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className={styles.candidateOverview}>
                    <div className={styles.candidateStatsGrid}>
                      <div className={styles.candidateStat}>
                        <div className={styles.candidateStatIcon}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 1v6m0 6v6"/>
                            <path d="m15.5 7.5 3 3-3 3"/>
                            <path d="m8.5 16.5-3-3 3-3"/>
                          </svg>
                        </div>
                        <div className={styles.candidateStatContent}>
                          <span className={styles.candidateStatLabel}>Available Positions</span>
                          <span className={styles.candidateStatValue}>
                            {availablePositions} Position{availablePositions !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className={styles.candidateStat}>
                        <div className={styles.candidateStatIcon}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10,9 9,9 8,9"/>
                          </svg>
                        </div>
                        <div className={styles.candidateStatContent}>
                          <span className={styles.candidateStatLabel}>Applied</span>
                          <span className={styles.candidateStatValue}>
                            {appliedApplications} Application{appliedApplications !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.candidateActions}>
                    <p className={styles.roleDescription}>
                      Explore and apply for tutor and lab assistant positions across various courses. Browse available opportunities and submit your applications.
                    </p>
                    <div className={styles.actionButton}>
                      <a href="/tutor" className={styles.primaryButton}>
                        View Opportunities
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
