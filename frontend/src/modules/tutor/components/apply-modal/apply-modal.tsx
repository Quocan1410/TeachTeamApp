import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CourseDetails } from "@/shared/types/courseTypes";
import type { Application as TutorApplication } from "@/shared/types/application";
import { Course, Role, ApplicationData } from "@/shared/services/applicationService";
import { availableSkills } from "@/modules/tutor/utils/skillOptions";
import SkillTag from "@/modules/tutor/components/skill-tag/skill-tag";
import styles from "./apply-modal.module.css";
import { getMelbourneTime, getMelbourneDateOnly } from "@/shared/utils/dateUtils";
import { DraftService } from "@/shared/services/draftService";

/**
 * Validation Rules for Tutor Application Form:
 *
 * 1. Previous Roles:
 *    - Optional field
 *    - Each role should be on a separate line
 *    - Format: [Course Code] [Role Type] (Year)
 *    - Example: COSC1111 Lab Assistant (2024)
 *    - Maximum 10 roles allowed
 *    - Each role should be at least 5 characters long
 *
 * 2. Academic Credentials:
 *    - Required field
 *    - Minimum 10 characters
 *
 * 3. Skills:
 *    - At least 2 skills required
 *    - Maximum 10 skills allowed
 *    - Skills should be relevant to the course
 *    - Duplicate skills are not allowed
 *    - Custom skills should be at least 2 characters long
 *    - Custom skills should not contain special characters
 *    - Skills should be alphanumeric with optional spaces
 */

interface ApplyModalProps {
  isOpen: boolean;
  course: CourseDetails | null;
  onClose: () => void;
  onSubmit: (application: TutorApplication) => void;
  currentUserId: string;
}

// Enhanced interface for new API compatibility
interface EnhancedApplyModalProps {
  isOpen: boolean;
  course: Course | null;
  role: Role | null;
  onClose: () => void;
  onSubmit: (applicationData: ApplicationData) => void;
  isSubmitting?: boolean;
}

// Combined interface to support both legacy and new usage
type CombinedApplyModalProps = ApplyModalProps | EnhancedApplyModalProps;

const ApplyModal: React.FC<CombinedApplyModalProps> = (props) => {
  // Type guards to determine which interface we're using
  const isLegacyProps = (props: CombinedApplyModalProps): props is ApplyModalProps => {
    return 'currentUserId' in props;
  };

  const isEnhancedProps = (props: CombinedApplyModalProps): props is EnhancedApplyModalProps => {
    return 'role' in props;
  };

  // Extract common props
  const { isOpen, onClose } = props;
  
  // Legacy props
  const legacyProps = isLegacyProps(props) ? props : null;
  const course = legacyProps?.course || (isEnhancedProps(props) ? props.course : null);
  const currentUserId = legacyProps?.currentUserId || '';
  
  // Enhanced props
  const enhancedProps = isEnhancedProps(props) ? props : null;
  const role = enhancedProps?.role || null;
  const isSubmitting = enhancedProps?.isSubmitting || false;

  // Form state for legacy mode
  const [previousRoles, setPreviousRoles] = useState("");
  const [academicCredentials, setAcademicCredentials] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  // Form state for enhanced mode
  const [availability, setAvailability] = useState<"Part Time" | "Full Time">("Part Time");
  const [experience, setExperience] = useState("");
  const [motivation, setMotivation] = useState("");
  const [selectedSkillTags, setSelectedSkillTags] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState("");

  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const saveDraftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validation error states
  const [errors, setErrors] = useState<{
    previousRoles?: string;
    academicCredentials?: string;
    skills?: string;
    motivation?: string;
    experience?: string;
  }>({});

  // Popular skills based on role (enhanced mode)
  const getPopularSkills = (roleName?: string) => {
    if (roleName === "tutor") {
      return ["Teaching", "Communication", "Subject Knowledge", "Patience", "Problem Solving"];
    } else if (roleName === "lab_assistant") {
      return ["Technical Support", "Laboratory Skills", "Equipment Handling", "Student Assistance", "Safety Protocols"];
    }
    return ["Teaching", "Communication", "Organization", "Technical Skills", "Leadership"];
  };

  // When modal opens, initialize with random skills (legacy mode) or reset form (enhanced mode)
  useEffect(() => {
    if (isOpen) {
      if (legacyProps && course) {
        // Legacy mode initialization
      const shuffled = [...availableSkills].sort(() => 0.5 - Math.random());
      setSelectedSkills(shuffled.slice(0, 2 + Math.floor(Math.random() * 2)));
        setErrors({});
      } else if (enhancedProps) {
        // Enhanced mode initialization
        setAvailability("Part Time");
        setExperience("");
        setMotivation("");
        setSelectedSkillTags([]);
        setCustomSkillInput("");
      setErrors({});
      }
    }
  }, [isOpen, course, legacyProps, enhancedProps]);

  /**
   * Validates and handles skill input when Enter key is pressed (legacy mode)
   */
  const handleSkillInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim() !== "") {
      e.preventDefault();
      if (skillInput.trim().length < 2) {
        setErrors((prev) => ({
          ...prev,
          skills: "Custom skills must be at least 2 characters long",
        }));
        return;
      }
      if (selectedSkills.length >= 5) {
        setErrors((prev) => ({
          ...prev,
          skills: "Maximum 5 skills allowed",
        }));
        return;
      }
      if (!/^[a-zA-Z0-9\s]+$/.test(skillInput.trim())) {
        setErrors((prev) => ({
          ...prev,
          skills: "Skills should only contain letters, numbers, and spaces",
        }));
        return;
      }
      if (!selectedSkills.includes(skillInput.trim())) {
        setSelectedSkills([...selectedSkills, skillInput.trim()]);
        setErrors((prev) => ({ ...prev, skills: undefined }));
      }
      setSkillInput("");
    }
  };

  /**
   * Removes a skill from the selected skills list (legacy mode)
   */
  const handleRemoveSkill = (skillToRemove: string) => {
    setSelectedSkills(selectedSkills.filter((skill) => skill !== skillToRemove));
  };

  /**
   * Enhanced mode skill handling
   */
  const handleAddSkillTag = (skill: string) => {
    if (skill.trim() && !selectedSkillTags.includes(skill.trim()) && selectedSkillTags.length < 10) {
      setSelectedSkillTags([...selectedSkillTags, skill.trim()]);
      setCustomSkillInput("");
    }
  };

  const handleRemoveSkillTag = (skillToRemove: string) => {
    const updatedTags = selectedSkillTags.filter(skill => skill !== skillToRemove);
    setSelectedSkillTags(updatedTags);
  };

  /**
   * Validates all form fields according to the validation rules
   */
  const validateForm = (): boolean => {
    const newErrors: {
      previousRoles?: string;
      academicCredentials?: string;
      skills?: string;
      motivation?: string;
      experience?: string;
    } = {};

    if (legacyProps) {
      // Legacy validation
      const roles = previousRoles.split("\n").filter((role) => role.trim() !== "");
    if (roles.length > 10) {
      newErrors.previousRoles = "Maximum 10 previous roles allowed";
    }
    for (const role of roles) {
      if (role.trim().length < 5) {
          newErrors.previousRoles = "Each role must be at least 5 characters long";
        break;
      }
      if (!/^[A-Z]+\d+.*\(\d{4}\)$/.test(role.trim())) {
          newErrors.previousRoles = "Roles should follow format: COSC1111 Lab Assistant (2024)";
        break;
      }
    }

    if (!academicCredentials.trim()) {
      newErrors.academicCredentials = "Academic credentials are required";
    } else if (academicCredentials.trim().length < 10) {
        newErrors.academicCredentials = "Academic credentials must be at least 10 characters long";
    }

    if (selectedSkills.length < 2) {
      newErrors.skills = "At least 2 skills are required";
      }
    } else if (enhancedProps) {
      // Enhanced validation
      if (selectedSkillTags.length === 0) {
        newErrors.skills = "Please select at least one skill";
      }

      if (!motivation.trim()) {
        newErrors.motivation = "Motivation is required";
      } else if (motivation.trim().length < 20) {
        newErrors.motivation = "Motivation must be at least 20 characters";
      }

      if (experience && experience.trim().length > 0 && experience.trim().length < 10) {
        newErrors.experience = "Experience description must be at least 10 characters if provided";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!course) return;

    if (!validateForm()) return;

    if (legacyProps) {
      // Legacy submission
    const application: TutorApplication = {
        id: getMelbourneTime().getTime().toString(),
      userId: currentUserId,
        email: "",
        fullName: "",
        courses: [(course as CourseDetails).code],
        previousRoles: previousRoles.split("\n").filter((role) => role.trim() !== ""),
        availability: (course as CourseDetails).availability,
      skills: selectedSkills,
      academicCredentials: academicCredentials,
      dateApplied: getMelbourneDateOnly(),
    };
      legacyProps.onSubmit(application);
    } else if (enhancedProps && role) {
      // Enhanced submission
      const applicationData: ApplicationData = {
        courseId: (course as Course).id,
        roleId: role.id,
        availability,
        skills: selectedSkillTags.join(", "),
        experience: experience.trim() || undefined,
        motivation: motivation.trim(),
      };
      enhancedProps.onSubmit(applicationData);
    }
  };

  useEffect(() => {
    if (!isOpen || !enhancedProps || !course || !role) return;

    const loadDraft = async () => {
      try {
        const res = await DraftService.getDraft(
          (course as Course).id,
          role.id
        );
        if (res.success && res.data?.payload) {
          const p = res.data.payload;
          if (p.availability === "Part Time" || p.availability === "Full Time") {
            setAvailability(p.availability);
          }
          if (p.skills) {
            setSelectedSkillTags(
              p.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
            );
          }
          if (p.experience) setExperience(p.experience);
          if (p.motivation) setMotivation(p.motivation);
          setDraftSavedAt(res.data.updatedAt);
        }
      } catch {
        // ignore
      }
    };
    loadDraft();
  }, [isOpen, enhancedProps, course, role]);

  useEffect(() => {
    if (!isOpen || !enhancedProps || !course || !role) return;

    if (saveDraftTimer.current) clearTimeout(saveDraftTimer.current);

    saveDraftTimer.current = setTimeout(async () => {
      try {
        const res = await DraftService.saveDraft((course as Course).id, role.id, {
          availability,
          skills: selectedSkillTags.join(", "),
          experience: experience.trim() || undefined,
          motivation: motivation.trim(),
        });
        if (res.success && res.data?.updatedAt) {
          setDraftSavedAt(res.data.updatedAt);
        }
      } catch {
        // ignore
      }
    }, 800);

    return () => {
      if (saveDraftTimer.current) clearTimeout(saveDraftTimer.current);
    };
  }, [
    isOpen,
    enhancedProps,
    course,
    role,
    availability,
    selectedSkillTags,
    experience,
    motivation,
  ]);

  // Don't render if modal is not open or no course is selected
  if (!isOpen || !course) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className={styles.applyModalBackdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className={styles.applyModal}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className={styles.applyModalHeader}>
          <div className={styles.applyModalHeaderContent}>
            <div className={styles.headerTitleSection}>
                <h3 className={styles.applyModalTitle}>
                  Apply for{" "}
                  <span className={styles.titleHighlight}>
                    {enhancedProps ? "position" : "course"}
                  </span>
                </h3>
              <p className={styles.headerSubtitle}>
                {enhancedProps
                  ? draftSavedAt
                    ? "Draft saved to your account"
                    : "Complete your application below"
                  : "Complete your application below"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={styles.applyModalClose}
                disabled={isSubmitting}
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className={styles.applyModalForm}>
          <form onSubmit={handleSubmit} className={styles.applyModalFormInner}>
            <div className={styles.applyModalScroll}>
              {/* Course Info */}
            <div className={styles.applyModalFieldGroup}>
              <label className={styles.applyModalLabel}>
                <span className={styles.labelAccent}>Course information</span>
              </label>
              <div className={styles.courseInfoCard}>
                <div className={styles.courseMainInfo}>
                    <h4 className={styles.courseCodeTitle}>
                      {legacyProps ? (course as CourseDetails).code : (course as Course).courseCode}
                    </h4>
                    <p className={styles.courseNameTitle}>
                      {legacyProps ? (course as CourseDetails).name : (course as Course).courseName}
                    </p>
                  </div>
              </div>
            </div>

              {/* Role & Availability */}
            <div className={styles.applyModalCompactGrid}>
              <div className={styles.applyModalFieldGroup}>
                <label className={styles.applyModalLabel}>
                  <span className={styles.labelAccent}>Role</span>
                </label>
                <div className={styles.roleInfoCard}>
                  <div className={styles.roleIconContainer}>
                      <svg className={styles.roleIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    </div>
                    <span className={styles.roleText}>
                      {enhancedProps && role 
                        ? (role.roleName === "tutor" ? "Tutor" : "Lab Assistant")
                        : (legacyProps ? (course as CourseDetails).role : "Role")
                      }
                    </span>
                  </div>
                </div>

                <div className={styles.applyModalFieldGroup}>
                  <label className={styles.applyModalLabel}>
                    <span className={styles.labelAccent}>Availability</span>
                  </label>
                  {enhancedProps ? (
                    <div
                      className={styles.availabilitySegment}
                      role="radiogroup"
                      aria-label="Availability"
                    >
                      <label
                        className={`${styles.availabilitySegmentOption} ${
                          availability === "Part Time" ? styles.availabilitySegmentActive : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="availability"
                          value="Part Time"
                          checked={availability === "Part Time"}
                          onChange={(e) =>
                            setAvailability(e.target.value as "Part Time" | "Full Time")
                          }
                          disabled={isSubmitting}
                        />
                        <span className={styles.segmentTitle}>Part time</span>
                      </label>
                      <label
                        className={`${styles.availabilitySegmentOption} ${
                          availability === "Full Time" ? styles.availabilitySegmentActive : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="availability"
                          value="Full Time"
                          checked={availability === "Full Time"}
                          onChange={(e) =>
                            setAvailability(e.target.value as "Part Time" | "Full Time")
                          }
                          disabled={isSubmitting}
                        />
                        <span className={styles.segmentTitle}>Full time</span>
                      </label>
                    </div>
                  ) : (
                    <div className={styles.availabilityCard}>
                      <div className={styles.availabilityIconContainer}>
                        <svg className={styles.availabilityIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className={styles.availabilityText}>
                        {legacyProps ? (course as CourseDetails).availability : "Full Time"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills Section */}
              <div className={styles.applyModalFieldGroup}>
                <label className={styles.applyModalLabel}>
                  <span className={styles.labelAccent}>
                    {enhancedProps ? "Your skills" : "Skills"}
                  </span>
                  <span className={styles.applyModalRequiredAsterisk}>*</span>
                  {enhancedProps && (
                    <span className={styles.applyModalHint}>Up to 10 skills</span>
                  )}
                </label>

                {enhancedProps ? (
                  <div className={styles.skillsPanel}>
                    {selectedSkillTags.length > 0 && (
                      <div className={styles.skillsSelectedBlock}>
                        <span className={styles.skillsBlockLabel}>
                          Selected{" "}
                          <span className={styles.skillsCount}>
                            {selectedSkillTags.length}/10
                          </span>
                        </span>
                        <div className={styles.skillTags}>
                          {selectedSkillTags.map((skill, index) => (
                            <SkillTag
                              key={index}
                              skill={skill}
                              onRemove={handleRemoveSkillTag}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <span className={styles.skillsBlockLabel}>Suggested for this role</span>
                    <div className={styles.skillsChipGrid}>
                      {getPopularSkills(role?.roleName).map((skill, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`${styles.skillChip} ${
                            selectedSkillTags.includes(skill)
                              ? styles.skillChipActive
                              : ""
                          }`}
                          onClick={() => handleAddSkillTag(skill)}
                          disabled={
                            selectedSkillTags.includes(skill) ||
                            selectedSkillTags.length >= 10 ||
                            isSubmitting
                          }
                        >
                          {skill}
                        </button>
                      ))}
                    </div>

                    <div className={styles.skillsAddRow}>
                      <input
                        type="text"
                        value={customSkillInput}
                        onChange={(e) => setCustomSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSkillTag(customSkillInput);
                          }
                        }}
                        placeholder="Add a custom skill…"
                        className={styles.skillsAddInput}
                        disabled={selectedSkillTags.length >= 10 || isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSkillTag(customSkillInput)}
                        className={styles.skillsAddBtn}
                        disabled={
                          !customSkillInput.trim() ||
                          selectedSkillTags.length >= 10 ||
                          isSubmitting
                        }
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Legacy Skills Section */}
                    <div className={styles.applyModalSkillsContainer}>
                      <div className={styles.applyModalAvailableSkills}>
                        <p className={styles.applyModalSecondaryText}>Available skills (click to add):</p>
                        <div className={styles.applyModalSkillsGrid}>
                          {availableSkills.map((skill, index) => (
                            <button
                              key={index}
                              type="button"
                              className={`${styles.skillButton} ${
                                selectedSkills.includes(skill) ? styles.skillButtonSelected : ""
                              }`}
                              onClick={() => {
                                if (selectedSkills.includes(skill)) {
                                  handleRemoveSkill(skill);
                                } else if (selectedSkills.length < 5) {
                                  setSelectedSkills([...selectedSkills, skill]);
                                  setErrors((prev) => ({ ...prev, skills: undefined }));
                                } else {
                                  setErrors((prev) => ({ ...prev, skills: "Maximum 5 skills allowed" }));
                                }
                              }}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      </div>

                      {selectedSkills.length > 0 && (
                        <div className={styles.applyModalSelectedSkills}>
                          <p className={styles.applyModalSecondaryText}>
                            Selected skills ({selectedSkills.length}/5):
                          </p>
                          <div className={styles.applyModalSkillsGrid}>
                            {selectedSkills.map((skill, index) => (
                              <SkillTag key={index} skill={skill} onRemove={handleRemoveSkill} />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className={styles.applyModalCustomSkill}>
                        <button
                          type="button"
                          onClick={() => setShowSkillInput(!showSkillInput)}
                          className={styles.applyModalAddSkillButton}
                          disabled={selectedSkills.length >= 5}
                        >
                          {showSkillInput ? "Hide Custom Skill" : "Add Custom Skill"}
                        </button>

                        {showSkillInput && (
                          <input
                            type="text"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={handleSkillInputKeyDown}
                            placeholder="Enter custom skill and press Enter"
                            className={styles.applyModalInput}
                            disabled={selectedSkills.length >= 5}
                          />
                        )}
                  </div>
                </div>
                  </>
                )}

                {errors.skills && (
                  <p className={styles.applyModalErrorText}>{errors.skills}</p>
                )}
            </div>

              {/* Legacy mode fields */}
              {legacyProps && (
                <>
            {/* Previous Teaching Roles */}
            <div className={styles.applyModalFieldGroup}>
              <label htmlFor="previousRoles" className={styles.applyModalLabel}>
                Previous Teaching Roles
              </label>
              <textarea
                id="previousRoles"
                value={previousRoles}
                onChange={(e) => setPreviousRoles(e.target.value)}
                placeholder="List your previous roles (one per line), e.g., COSC1111 Lab Assistant (2024)"
                      className={`${styles.applyModalInput} ${errors.previousRoles ? styles.applyModalInputError : ""}`}
                rows={3}
              />
              {errors.previousRoles && (
                      <p className={styles.applyModalErrorText}>{errors.previousRoles}</p>
              )}
              <p className={styles.applyModalSecondaryText}>
                      Format: [Course Code] [Role Type] (Year) - One per line, maximum 10 roles
              </p>
            </div>

            {/* Academic Credentials */}
            <div className={styles.applyModalFieldGroup}>
                    <label htmlFor="academicCredentials" className={styles.applyModalLabel}>
                Academic Credentials
              </label>
              <textarea
                id="academicCredentials"
                value={academicCredentials}
                onChange={(e) => setAcademicCredentials(e.target.value)}
                placeholder="Describe your academic background, degrees, certifications, etc."
                      className={`${styles.applyModalInput} ${errors.academicCredentials ? styles.applyModalInputError : ""}`}
                rows={4}
                required
              />
              {errors.academicCredentials && (
                      <p className={styles.applyModalErrorText}>{errors.academicCredentials}</p>
                    )}
                    <p className={styles.applyModalSecondaryText}>Minimum 10 characters required.</p>
                  </div>
                </>
              )}

              {/* Enhanced mode fields */}
              {enhancedProps && (
                <>
                  {/* Experience */}
            <div className={styles.applyModalFieldGroup}>
                    <label htmlFor="experience" className={styles.applyModalLabel}>
                      Previous Experience <span className={styles.applyModalOptional}>(optional)</span>
                    </label>
                    <textarea
                      id="experience"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="Describe any relevant teaching, tutoring, or related experience..."
                      className={`${styles.applyModalInput} ${errors.experience ? styles.applyModalInputError : ""}`}
                      rows={3}
                      disabled={isSubmitting}
                    />
                    {errors.experience && (
                      <p className={styles.applyModalErrorText}>{errors.experience}</p>
                    )}
              </div>

                  {/* Motivation */}
                  <div className={styles.applyModalFieldGroup}>
                    <label htmlFor="motivation" className={styles.applyModalLabel}>
                      Why do you want this role? 
                      <span className={styles.applyModalRequiredAsterisk}>*</span>
                      <span className={styles.applyModalHint}>(minimum 20 characters)</span>
                    </label>
                    <textarea
                      id="motivation"
                      value={motivation}
                      onChange={(e) => setMotivation(e.target.value)}
                      placeholder="Explain your motivation for applying to this role and what you hope to contribute..."
                      className={`${styles.applyModalInput} ${errors.motivation ? styles.applyModalInputError : ""}`}
                      rows={4}
                      disabled={isSubmitting}
                      required
                    />
                    {errors.motivation && (
                      <p className={styles.applyModalErrorText}>{errors.motivation}</p>
                    )}
              </div>
                </>
              )}
            </div>

              {/* Submit Button */}
              <div className={styles.applyModalActions}>
                <button
                  type="button"
                  onClick={onClose}
                  className={styles.applyModalCancelButton}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                    <button
                  type="submit"
                  className={styles.applyModalSubmitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className={styles.applyModalSpinner} viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" 
                                strokeDasharray="32" strokeDashoffset="32">
                          <animateTransform attributeName="transform" type="rotate" 
                                          values="0 12 12;360 12 12" dur="1s" repeatCount="indefinite" />
                        </circle>
                        </svg>
                      Submitting...
                    </>
                  ) : enhancedProps ? (
                    "Submit Application"
                  ) : (
                    "Submit Application"
                  )}
              </button>
            </div>
          </form>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ApplyModal;
