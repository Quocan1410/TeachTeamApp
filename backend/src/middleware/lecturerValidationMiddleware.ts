import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authMiddleware";

interface ValidationError {
    field: string;
    message: string;
    code?: string;
}

interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

function validationErrorResponse(errors: ValidationError[]) {
    const fieldErrors = errors.reduce((acc, error) => {
        acc[error.field] = error.message;
        return acc;
    }, {} as Record<string, string>);

    return {
        success: false,
        message: errors[0]?.message ?? "Validation failed",
        errors: fieldErrors,
        validationErrors: errors,
    };
}

/**
 * Validates comment data for lecturer operations
 */
export const validateLecturerComment = (comment: string): ValidationResult => {
    const errors: ValidationError[] = [];

    if (comment !== undefined && comment !== null) {
        const trimmedComment = comment.trim();

        // Length validation
        if (trimmedComment.length > 1000) {
            errors.push({
                field: "comment",
                message: "Comment must be less than 1000 characters",
                code: "COMMENT_TOO_LONG",
            });
        }

        // Professional content validation
        const restrictedWords = ["asdf", "qwerty", "spam"];
        const lowerComment = trimmedComment.toLowerCase();
        const foundRestrictedWords = restrictedWords.filter((word) =>
            new RegExp(`\\b${word}\\b`, "i").test(lowerComment)
        );

        if (foundRestrictedWords.length > 0) {
            errors.push({
                field: "comment",
                message: `Comment contains inappropriate content: ${foundRestrictedWords.join(
                    ", "
                )}`,
                code: "COMMENT_INAPPROPRIATE",
            });
        }

        // Check for unprofessional patterns
        const unprofessionalPatterns = [
            {
                pattern: /(.)\1{4,}/,
                message: "Comment contains excessive repeated characters",
            },
            {
                pattern: /^[A-Z\s!]{10,}$/,
                message: "Comment should not be all capitals",
            },
            {
                pattern: /[!?]{3,}/,
                message: "Comment contains excessive punctuation",
            },
        ];

        for (const { pattern, message } of unprofessionalPatterns) {
            if (pattern.test(trimmedComment)) {
                errors.push({
                    field: "comment",
                    message,
                    code: "COMMENT_UNPROFESSIONAL",
                });
                break;
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validates status update requests
 */
export const validateStatusUpdate = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const { status, comment, selectedCourses } = req.body;
    const errors: ValidationError[] = [];

    // Status validation
    const allowedStatuses = ["pending", "selected", "rejected"];
    if (!status) {
        errors.push({
            field: "status",
            message: "Status is required",
            code: "STATUS_REQUIRED",
        });
    } else if (!allowedStatuses.includes(status)) {
        errors.push({
            field: "status",
            message: `Status must be one of: ${allowedStatuses.join(", ")}`,
            code: "STATUS_INVALID",
        });
    }

    // Each application belongs to a single course — selectedCourses in the body is optional legacy input.
    if (
        status === "selected" &&
        selectedCourses &&
        Array.isArray(selectedCourses) &&
        selectedCourses.length > 0
    ) {
        const invalidCourses = selectedCourses.filter((course: string) => {
            return !(
                course &&
                typeof course === "string" &&
                /^[A-Z]{4}\d{4}$/.test(course.trim())
            );
        });

        if (invalidCourses.length > 0) {
            errors.push({
                field: "selectedCourses",
                message: "All course codes must follow format: COSC1234",
                code: "COURSES_INVALID_FORMAT",
            });
        }

        const uniqueCourses = [...new Set(selectedCourses)];
        if (uniqueCourses.length !== selectedCourses.length) {
            errors.push({
                field: "selectedCourses",
                message: "Duplicate courses are not allowed",
                code: "COURSES_DUPLICATE",
            });
        }
    }



    // Validate comment if provided
    if (comment) {
        const commentValidation = validateLecturerComment(comment);
        errors.push(...commentValidation.errors);
    }

    // Application ID validation
    const { id } = req.params;
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
        errors.push({
            field: "applicationId",
            message: "Valid application ID is required",
            code: "APPLICATION_ID_INVALID",
        });
    }

    if (errors.length > 0) {
        res.status(400).json(validationErrorResponse(errors));
        return;
    }

    next();
};

/**
 * Validates comment submission requests
 */
export const validateCommentSubmission = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const { comment } = req.body;
    const { id } = req.params;
    const errors: ValidationError[] = [];

    // Application ID validation
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
        errors.push({
            field: "applicationId",
            message: "Valid application ID is required",
            code: "APPLICATION_ID_INVALID",
        });
    }

    // Comment validation
    if (comment !== undefined) {
        const commentValidation = validateLecturerComment(comment);
        errors.push(...commentValidation.errors);
    }

    if (errors.length > 0) {
        res.status(400).json(validationErrorResponse(errors));
        return;
    }

    next();
};

/**
 * Validates ranking operation requests
 */
export const validateRankingOperation = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const { rank, courseCode } = req.body;
    const { id } = req.params;
    const errors: ValidationError[] = [];

    // Application ID validation
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
        errors.push({
            field: "applicationId",
            message: "Valid application ID is required",
            code: "APPLICATION_ID_INVALID",
        });
    }

    // Rank validation
    if (rank === undefined || rank === null) {
        errors.push({
            field: "rank",
            message: "Rank is required",
            code: "RANK_REQUIRED",
        });
    } else if (!Number.isInteger(rank) || rank <= 0) {
        errors.push({
            field: "rank",
            message: "Rank must be a positive integer",
            code: "RANK_INVALID",
        });
    } else if (rank > 100) {
        errors.push({
            field: "rank",
            message: "Rank cannot exceed 100",
            code: "RANK_TOO_HIGH",
        });
    }

    // Course code validation
    if (!courseCode) {
        errors.push({
            field: "courseCode",
            message: "Course code is required for ranking",
            code: "COURSE_CODE_REQUIRED",
        });
    } else if (
        typeof courseCode !== "string" ||
        !/^[A-Z]{4}\d{4}$/.test(courseCode.trim())
    ) {
        errors.push({
            field: "courseCode",
            message: "Course code must follow format: COSC1234",
            code: "COURSE_CODE_INVALID",
        });
    }

    if (errors.length > 0) {
        res.status(400).json(validationErrorResponse(errors));
        return;
    }

    next();
};

/**
 * Validates lecturer filter parameters
 */
export const validateLecturerFilters = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const {
        candidateName,
        roleType,
        availability,
        skills,
        courseCode,
        status,
    } = req.query;
    const errors: ValidationError[] = [];

    // Candidate name validation
    if (
        candidateName &&
        typeof candidateName === "string" &&
        candidateName.length > 100
    ) {
        errors.push({
            field: "candidateName",
            message: "Candidate name filter must be less than 100 characters",
            code: "CANDIDATE_NAME_TOO_LONG",
        });
    }

    // Role type validation
    if (roleType && !["tutor", "lab_assistant"].includes(roleType as string)) {
        errors.push({
            field: "roleType",
            message: 'Role type must be either "tutor" or "lab_assistant"',
            code: "ROLE_TYPE_INVALID",
        });
    }

    // Availability validation
    if (
        availability &&
        !["Part Time", "Full Time"].includes(availability as string)
    ) {
        errors.push({
            field: "availability",
            message: 'Availability must be either "Part Time" or "Full Time"',
            code: "AVAILABILITY_INVALID",
        });
    }

    // Skills validation
    if (skills && typeof skills === "string" && skills.length > 200) {
        errors.push({
            field: "skills",
            message: "Skills filter must be less than 200 characters",
            code: "SKILLS_TOO_LONG",
        });
    }

    // Course code validation
    if (courseCode && courseCode !== "all" && typeof courseCode === "string") {
        if (!/^[A-Z]{4}\d{4}$/.test(courseCode)) {
            errors.push({
                field: "courseCode",
                message: "Course code must follow format: COSC1234",
                code: "COURSE_CODE_INVALID",
            });
        }
    }

    // Status validation
    if (
        status &&
        !["all", "pending", "selected", "rejected"].includes(
            status as string
        )
    ) {
        errors.push({
            field: "status",
            message:
                "Status must be one of: all, pending, selected, rejected",
            code: "STATUS_INVALID",
        });
    }

    if (errors.length > 0) {
        res.status(400).json({
            success: false,
            message: "Invalid filter parameters",
            errors: errors.reduce((acc, error) => {
                acc[error.field] = error.message;
                return acc;
            }, {} as Record<string, string>),
            validationErrors: errors,
        });
        return;
    }

    next();
};

/**
 * General purpose validation for lecturer access to applications
 */
export const validateLecturerApplicationAccess = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const lecturerId = req.user?.userId;
        const { id } = req.params;

        if (!lecturerId) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
                code: "AUTH_REQUIRED",
            });
            return;
        }

        if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
            res.status(400).json({
                success: false,
                message: "Valid application ID is required",
                code: "APPLICATION_ID_INVALID",
            });
            return;
        }

        // Store validated data for use in subsequent middleware/controllers
        req.validatedData = {
            lecturerId: lecturerId.toString(),
            applicationId: Number(id),
        };

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Validation error",
            code: "VALIDATION_ERROR",
        });
    }
};

/**
 * Sanitizes and prepares comment data
 */
export const sanitizeCommentData = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.body.comment !== undefined) {
        // Sanitize comment
        req.body.comment = req.body.comment
            .trim()
            .replace(/\s+/g, " ") // Replace multiple spaces with single space
            .replace(/\n\s*\n\s*\n/g, "\n\n") // Remove excessive line breaks
            .substring(0, 1000);
    }

    next();
};

// Extend the Request interface to include validated data
declare global {
    namespace Express {
        interface Request {
            validatedData?: {
                lecturerId: string;
                applicationId: number;
            };
        }
    }
}
