import { UserType } from "../entities/User";
import { getAdminEmail, isCanonicalAdminEmail } from "./adminConfig";
import { validateNewPassword } from "./passwordRules";
import { SecurityQuestionService } from "../services/SecurityQuestionService";

interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

// Helper function to determine userType based on email domain
export const getUserTypeFromEmail = (email: string): UserType | null => {
    const emailLowercase = email.toLowerCase();

    if (emailLowercase.endsWith("@candidate.edu.au")) {
        return UserType.CANDIDATE;
    } else if (emailLowercase.endsWith("@lecturer.edu.au")) {
        return UserType.LECTURER;
    } else if (isCanonicalAdminEmail(emailLowercase)) {
        return UserType.ADMIN;
    }

    return null;
};

// Helper function to validate email domain requirements
export const validateEmailDomain = (email: string, expectedUserType?: UserType): { isValid: boolean; expectedDomain?: string } => {
    const emailLowercase = email.toLowerCase();

    // If no expected user type, just check if it matches any valid domain
    if (!expectedUserType) {
        const userType = getUserTypeFromEmail(email);
        return { isValid: userType !== null };
    }

    // Check if email matches the expected user type domain
    switch (expectedUserType) {
        case UserType.CANDIDATE:
            return {
                isValid: emailLowercase.endsWith("@candidate.edu.au"),
                expectedDomain: "@candidate.edu.au"
            };
        case UserType.LECTURER:
            return {
                isValid: emailLowercase.endsWith("@lecturer.edu.au"),
                expectedDomain: "@lecturer.edu.au"
            };
        case UserType.ADMIN:
            return {
                isValid: isCanonicalAdminEmail(emailLowercase),
                expectedDomain: getAdminEmail(),
            };
        default:
            return { isValid: false };
    }
};

export const validateSignupData = (data: any): ValidationResult => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!data.email) {
        errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = "Please enter a valid email address";
    } else {
        // Always check if email domain is valid for any user type
        const domainValidation = validateEmailDomain(data.email);
        if (!domainValidation.isValid) {
            errors.email = "Email must end with @candidate.edu.au (for candidates) or @lecturer.edu.au (for lecturers)";
        } else {
            // If userType is provided, validate it matches the email domain
            if (data.userType) {
                const userTypeFromEmail = getUserTypeFromEmail(data.email);
                if (userTypeFromEmail && userTypeFromEmail !== data.userType) {
                    const expectedDomain = userTypeFromEmail === UserType.CANDIDATE ? "@candidate.edu.au" : "@lecturer.edu.au";
                    errors.email = `Email domain does not match selected user type. Use ${expectedDomain} for ${userTypeFromEmail}s`;
                }
            }
        }
    }

    // Password validation
    if (!data.password) {
        errors.password = "Password is required";
    } else if (data.password.length < 8) {
        errors.password = "Password must be at least 8 characters long";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
        errors.password =
            "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    } else {
        // Check for emojis in password
        const emojiRegex = /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\uD800-\uDBFF][\uDC00-\uDFFF]/u;
        if (emojiRegex.test(data.password)) {
            errors.password = "Password cannot contain emojis";
        }
    }

    // Confirm password validation
    if (!data.confirmPassword) {
        errors.confirmPassword = "Please confirm your password";
    } else if (data.password !== data.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
    }

    // First name validation
    if (!data.firstName) {
        errors.firstName = "First name is required";
    } else if (data.firstName.length < 1) {
        errors.firstName = "First name must be at least 1 character long";
    } else {
        // Check for emojis in first name
        const emojiRegex = /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\uD800-\uDBFF][\uDC00-\uDFFF]/u;
        if (emojiRegex.test(data.firstName)) {
            errors.firstName = "First name cannot contain emojis";
        } else if (!/^[a-zA-Z'-]+$/.test(data.firstName)) {
            errors.firstName = "First name can only contain letters, apostrophes and hyphens";
        }
    }

    // Last name validation
    if (!data.lastName) {
        errors.lastName = "Last name is required";
    } else if (data.lastName.length < 1) {
        errors.lastName = "Last name must be at least 1 character long";
    } else {
        // Check for emojis in last name
        const emojiRegex = /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\uD800-\uDBFF][\uDC00-\uDFFF]/u;
        if (emojiRegex.test(data.lastName)) {
            errors.lastName = "Last name cannot contain emojis";
        } else if (!/^[a-zA-Z\s'-]+$/.test(data.lastName)) {
            errors.lastName =
                "Last name can only contain letters, spaces, apostrophes and hyphens";
        }
    }

    // User type validation - now optional since we can derive it from email
    if (data.userType && !Object.values(UserType).includes(data.userType)) {
        errors.userType = "Invalid user type";
    }

    const allowedHonorifics = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."];
    if (!data.honorific || !String(data.honorific).trim()) {
        errors.honorific = "Please select a title";
    } else if (!allowedHonorifics.includes(String(data.honorific).trim())) {
        errors.honorific = "Invalid title";
    }

    const securityValidation = SecurityQuestionService.validateSecurityAnswersInput(
        data.securityAnswers
    );
    if (!securityValidation.isValid) {
        Object.assign(errors, securityValidation.errors);
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateForgotPasswordEmail = (email: string): ValidationResult => {
    const errors: Record<string, string> = {};

    if (!email?.trim()) {
        errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Please enter a valid email address";
    } else {
        const emailLower = email.trim().toLowerCase();
        const domainOk =
            emailLower.endsWith("@candidate.edu.au") ||
            emailLower.endsWith("@lecturer.edu.au");
        if (!domainOk) {
            errors.email =
                "Password reset is only available for @candidate.edu.au and @lecturer.edu.au accounts";
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateChangePasswordData = (data: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
}): ValidationResult => {
    const errors: Record<string, string> = {};

    if (!data.currentPassword?.trim()) {
        errors.currentPassword = "Current password is required";
    }

    const passwordError = validateNewPassword(data.newPassword || "");
    if (passwordError) {
        errors.newPassword = passwordError;
    }

    if (!data.confirmPassword) {
        errors.confirmPassword = "Please confirm your new password";
    } else if (data.newPassword !== data.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateResetPasswordData = (data: {
    token?: string;
    password?: string;
    confirmPassword?: string;
}): ValidationResult => {
    const errors: Record<string, string> = {};
    if (!data.token?.trim()) {
        errors.token = "Reset token is required";
    }

    const passwordError = validateNewPassword(data.password || "");
    if (passwordError) {
        errors.password = passwordError;
    }

    if (!data.confirmPassword) {
        errors.confirmPassword = "Please confirm your password";
    } else if (data.password !== data.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateSigninData = (data: any): ValidationResult => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!data.email) {
        errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!data.password) {
        errors.password = "Password is required";
    } else {
        // Check for emojis in password
        const emojiRegex = /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\uD800-\uDBFF][\uDC00-\uDFFF]/u;
        if (emojiRegex.test(data.password)) {
            errors.password = "Password cannot contain emojis";
        }
    }

    const isValid = Object.keys(errors).length === 0;

    return {
        isValid,
        errors,
    };
};

export const validateApplicationData = (data: any): ValidationResult => {
    const errors: Record<string, string> = {};

    // Course ID validation
    if (!data.courseId) {
        errors.courseId = "Course is required";
    } else if (!Number.isInteger(data.courseId) || data.courseId <= 0) {
        errors.courseId = "Invalid course selection";
    }

    // Role ID validation
    if (!data.roleId) {
        errors.roleId = "Role is required";
    } else if (!Number.isInteger(data.roleId) || data.roleId <= 0) {
        errors.roleId = "Invalid role selection";
    }

    // Availability validation
    if (!data.availability) {
        errors.availability = "Availability is required";
    } else if (!["Part Time", "Full Time"].includes(data.availability)) {
        errors.availability = "Invalid availability type";
    }

    // Skills validation
    if (!data.skills) {
        errors.skills = "Skills are required";
    } else if (data.skills.length < 10) {
        errors.skills = "Skills description must be at least 10 characters long";
    } else if (data.skills.length > 1000) {
        errors.skills = "Skills description must be less than 1000 characters";
    }

    // Experience validation (optional)
    if (data.experience && data.experience.length > 2000) {
        errors.experience = "Experience description must be less than 2000 characters";
    }

    // Motivation validation
    if (!data.motivation) {
        errors.motivation = "Motivation is required";
    } else if (data.motivation.length < 20) {
        errors.motivation = "Motivation must be at least 20 characters long";
    } else if (data.motivation.length > 1000) {
        errors.motivation = "Motivation must be less than 1000 characters";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};
