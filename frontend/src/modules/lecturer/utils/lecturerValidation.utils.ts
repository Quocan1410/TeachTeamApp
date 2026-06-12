// Lecturer-specific validation utilities

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

export interface CommentValidationConfig {
    minLength?: number;
    maxLength?: number;
    allowEmpty?: boolean;
    restrictedWords?: string[];
}

export interface StatusUpdateValidationConfig {
    allowedStatuses?: string[];
    requireComment?: boolean;
    requireCourseSelection?: boolean;
}

// Default validation configurations
export const DEFAULT_COMMENT_CONFIG: CommentValidationConfig = {
    minLength: 5,
    maxLength: 1000,
    allowEmpty: false,
    restrictedWords: ["asdf", "qwerty", "spam"]
};

export const DEFAULT_STATUS_CONFIG: StatusUpdateValidationConfig = {
    allowedStatuses: ["pending", "selected", "rejected"],
    requireComment: false,
    requireCourseSelection: true
};

/**
 * Validates lecturer comment input
 */
export const validateLecturerComment = (
    comment: string,
    config: CommentValidationConfig = DEFAULT_COMMENT_CONFIG
): ValidationResult => {
    const errors: Record<string, string> = {};

    // Handle null/undefined input
    if (comment === null || comment === undefined) {
        comment = "";
    }

    const trimmedComment = comment.trim();

    // Empty validation
    if (!config.allowEmpty && !trimmedComment) {
        errors.comment = "Comment is required";
        return { isValid: false, errors };
    }

    // Allow empty if configured
    if (config.allowEmpty && !trimmedComment) {
        return { isValid: true, errors: {} };
    }

    // Maximum length validation (check first, as it's more critical)
    if (config.maxLength && trimmedComment.length > config.maxLength) {
        errors.comment = `Comment must be less than ${config.maxLength} characters long`;
    }

    // If already has max length error, don't check other validations
    if (errors.comment) {
        return { isValid: false, errors };
    }

    // Minimum length validation
    if (config.minLength && trimmedComment.length < config.minLength) {
        errors.comment = `Comment must be at least ${config.minLength} characters long`;
    }

    // Restricted words validation
    if (config.restrictedWords && config.restrictedWords.length > 0) {
        const lowerComment = trimmedComment.toLowerCase();
        const foundRestrictedWords = config.restrictedWords.filter((word) =>
            new RegExp(`\\b${word.toLowerCase()}\\b`, "i").test(lowerComment)
        );

        if (foundRestrictedWords.length > 0) {
            errors.comment = `Comment contains inappropriate content: ${foundRestrictedWords.join(", ")}`;
        }
    }

    // Professional content validation
    if (trimmedComment.length >= 5) {
        // Check for unprofessional patterns
        const unprofessionalPatterns = [
            /(.)\1{4,}/, // Repeated characters (5+ times) - removed 'g' flag
            /^[A-Z\s!]{5,}$/, // All caps with exclamation - reduced length and removed 'g' flag
            /[!?]{3,}/, // Multiple exclamation/question marks - removed 'g' flag
        ];

        for (const pattern of unprofessionalPatterns) {
            if (pattern.test(trimmedComment)) {
                errors.comment = "Please ensure your comment is professional and constructive";
                break;
            }
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validates application status update
 */
export const validateStatusUpdate = (
    applicationId: string,
    newStatus: string,
    selectedCourses: string[] = [],
    comment: string = "",
    config: StatusUpdateValidationConfig = DEFAULT_STATUS_CONFIG
): ValidationResult => {
    const errors: Record<string, string> = {};

    // Application ID validation
    if (!applicationId || !applicationId.trim()) {
        errors.applicationId = "Application ID is required";
    }

    // Status validation
    if (!newStatus || !newStatus.trim()) {
        errors.status = "Status is required";
    } else if (config.allowedStatuses && !config.allowedStatuses.includes(newStatus)) {
        errors.status = `Status must be one of: ${config.allowedStatuses.join(", ")}`;
    }

    // Course selection validation for selection
    if (config.requireCourseSelection && newStatus === "selected") {
        if (!selectedCourses || selectedCourses.length === 0) {
            errors.courses = "Please select at least one course when selecting an applicant";
        }
    }

    // Comment requirement validation for rejection
    if (config.requireComment && newStatus === "rejected") {
        if (!comment || !comment.trim()) {
            errors.comment = "Comment is required when rejecting an applicant";
        }
    }

    // Validate comment if provided
    if (comment && comment.trim()) {
        const commentValidation = validateLecturerComment(comment, {
            ...DEFAULT_COMMENT_CONFIG,
            allowEmpty: !config.requireComment
        });

        if (!commentValidation.isValid) {
            Object.assign(errors, commentValidation.errors);
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validates ranking operation
 */
export const validateRankingOperation = (
    applicationId: string,
    rank: number,
    courseCode: string
): ValidationResult => {
    const errors: Record<string, string> = {};

    // Application ID validation
    if (!applicationId || !applicationId.trim()) {
        errors.applicationId = "Application ID is required";
    }

    // Rank validation
    if (!Number.isInteger(rank) || rank <= 0) {
        errors.rank = "Rank must be a positive integer";
    } else if (rank > 100) {
        errors.rank = "Rank cannot exceed 100";
    }

    // Course code validation
    if (!courseCode || !courseCode.trim()) {
        errors.courseCode = "Course code is required for ranking";
    } else if (!/^[A-Z]{4}\d{4}$/.test(courseCode.trim())) {
        errors.courseCode = "Course code must follow format: COSC1234";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validates course selection for lecturer operations
 */
export const validateCourseSelection = (
    selectedCourses: string[],
    availableCourses: string[] = [],
    minSelection: number = 1,
    maxSelection?: number
): ValidationResult => {
    const errors: Record<string, string> = {};

    // Minimum selection validation
    if (selectedCourses.length < minSelection) {
        errors.courses = `Please select at least ${minSelection} course${minSelection > 1 ? 's' : ''}`;
    }

    // Maximum selection validation
    if (maxSelection && selectedCourses.length > maxSelection) {
        errors.courses = `Please select no more than ${maxSelection} course${maxSelection > 1 ? 's' : ''}`;
    }

    // Available courses validation
    if (availableCourses.length > 0) {
        const invalidCourses = selectedCourses.filter(course => !availableCourses.includes(course));
        if (invalidCourses.length > 0) {
            errors.courses = `Invalid course selection: ${invalidCourses.join(", ")}`;
        }
    }

    // Duplicate courses validation
    const duplicates = selectedCourses.filter((course, index) => selectedCourses.indexOf(course) !== index);
    if (duplicates.length > 0) {
        errors.courses = `Duplicate course selection: ${duplicates.join(", ")}`;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validates lecturer filter inputs
 */
export const validateLecturerFilters = (filters: {
    searchQuery?: string;
    courseCode?: string;
    status?: string;
    roleType?: string;
    availability?: string;
    skills?: string;
}): ValidationResult => {
    const errors: Record<string, string> = {};

    // Search query validation
    if (filters.searchQuery && filters.searchQuery.length > 100) {
        errors.searchQuery = "Search query must be less than 100 characters";
    }

    // Course code validation
    if (filters.courseCode && filters.courseCode !== "all") {
        if (!/^[A-Z]{4}\d{4}$/.test(filters.courseCode)) {
            errors.courseCode = "Invalid course code format";
        }
    }

    // Status validation
    if (filters.status && !["all", "pending", "selected"].includes(filters.status)) {
        errors.status = "Invalid status filter";
    }

    // Role type validation
    if (filters.roleType && !["all", "tutor", "lab_assistant"].includes(filters.roleType)) {
        errors.roleType = "Invalid role type filter";
    }

    // Availability validation
    if (filters.availability && !["all", "Part Time", "Full Time"].includes(filters.availability)) {
        errors.availability = "Invalid availability filter";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Helper function to sanitize and prepare comment for submission
 */
export const sanitizeComment = (comment: string): string => {
    // Handle null/undefined input
    if (comment === null || comment === undefined) {
        return "";
    }

    return comment
        .trim()
        .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space (preserve line breaks)
        .replace(/\n\s*\n\s*\n+/g, '\n\n') // Remove excessive line breaks (3+ becomes 2)
        .substring(0, 1000); // Enforce max length
};

/**
 * Helper function to format validation errors for display
 */
export const formatValidationErrors = (errors: Record<string, string>): string[] => {
    return Object.values(errors).filter(error => error && error.trim().length > 0);
};

/**
 * Enhanced error handling for validation operations
 */
export interface ValidationErrorDetails {
    field: string;
    message: string;
    code?: string;
    severity?: 'error' | 'warning' | 'info';
}

export interface EnhancedValidationResult extends ValidationResult {
    errorDetails?: ValidationErrorDetails[];
    suggestions?: string[];
    hasNetworkError?: boolean;
}

/**
 * Validates lecturer form submission with enhanced error handling
 */
export const validateLecturerFormSubmission = (data: {
    applicationId: string;
    action: 'comment' | 'status' | 'ranking';
    comment?: string;
    status?: string;
    selectedCourses?: string[];
    rank?: number;
    courseCode?: string;
}): EnhancedValidationResult => {
    const errors: Record<string, string> = {};
    const errorDetails: ValidationErrorDetails[] = [];
    const suggestions: string[] = [];

    // Application ID validation
    if (!data.applicationId || !data.applicationId.trim()) {
        errors.applicationId = "Application ID is required";
        errorDetails.push({
            field: 'applicationId',
            message: 'Application ID is required',
            code: 'REQUIRED_FIELD',
            severity: 'error'
        });
    }

    // Action-specific validation
    switch (data.action) {
        case 'comment':
            if (data.comment !== undefined) {
                const commentValidation = validateLecturerComment(data.comment, {
                    ...DEFAULT_COMMENT_CONFIG,
                    allowEmpty: true,
                    minLength: 3
                });

                if (!commentValidation.isValid) {
                    Object.assign(errors, commentValidation.errors);
                    suggestions.push("Keep comments professional and between 3-1000 characters");
                }
            }
            break;

        case 'status':
            if (data.status) {
                const statusValidation = validateStatusUpdate(
                    data.applicationId,
                    data.status,
                    data.selectedCourses || [],
                    data.comment || ""
                );

                if (!statusValidation.isValid) {
                    Object.assign(errors, statusValidation.errors);
                    if (data.status === 'selected' && (!data.selectedCourses || data.selectedCourses.length === 0)) {
                        suggestions.push("Select at least one course when accepting an applicant");
                    }
                }
            }
            break;

        case 'ranking':
            if (data.rank !== undefined && data.courseCode) {
                const rankingValidation = validateRankingOperation(
                    data.applicationId,
                    data.rank,
                    data.courseCode
                );

                if (!rankingValidation.isValid) {
                    Object.assign(errors, rankingValidation.errors);
                    suggestions.push("Ensure rank is between 1-100 and course code follows COSC1234 format");
                }
            }
            break;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
        suggestions: suggestions.length > 0 ? suggestions : undefined
    };
};

/**
 * Network error handler for validation operations
 */
export const handleValidationNetworkError = (): EnhancedValidationResult => {

    return {
        isValid: false,
        errors: {
            network: "Unable to validate data. Please check your connection and try again."
        },
        hasNetworkError: true,
        suggestions: [
            "Check your internet connection",
            "Try refreshing the page",
            "Contact support if the problem persists"
        ]
    };
};

/**
 * Retry mechanism for validation operations
 */
export const retryValidation = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            // Don't retry on validation errors, only network errors
            if (error && typeof error === 'object' && 'code' in error) {
                if ((error as { code: string }).code !== 'NETWORK_ERROR') {
                    throw error;
                }
            }

            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
    }

    throw lastError!;
}; 