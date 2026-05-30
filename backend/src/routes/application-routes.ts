import { Router } from "express";
import { ApplicationController } from "../controllers/ApplicationController";
import {
    authenticateToken,
    requireUserType,
} from "../middleware/authMiddleware";
import {
    validateStatusUpdate,
    validateCommentSubmission,
    validateRankingOperation,
    validateLecturerFilters,
    validateLecturerApplicationAccess,
    sanitizeCommentData,
} from "../middleware/lecturerValidationMiddleware";

const router = Router();
const applicationController = new ApplicationController();

// Enhanced application validation middleware
const validateApplicationFields = (req: any, res: any, next: any) => {
    const { courseId, roleId, availability, skills, motivation, experience } =
        req.body;
    const errors: Record<string, string> = {};

    // Course ID validation
    if (!courseId) {
        errors.courseId = "Course is required";
    } else if (!Number.isInteger(Number(courseId)) || Number(courseId) <= 0) {
        errors.courseId = "Invalid course selection";
    }

    // Role ID validation
    if (!roleId) {
        errors.roleId = "Role is required";
    } else if (!Number.isInteger(Number(roleId)) || Number(roleId) <= 0) {
        errors.roleId = "Invalid role selection";
    }

    // Availability validation
    if (!availability) {
        errors.availability = "Availability is required";
    } else if (!["Part Time", "Full Time"].includes(availability)) {
        errors.availability =
            "Availability must be either 'Part Time' or 'Full Time'";
    }

    // Skills validation
    if (!skills) {
        errors.skills = "Skills are required";
    } else if (typeof skills === "string") {
        if (skills.trim().length < 10) {
            errors.skills =
                "Skills description must be at least 10 characters long";
        } else if (skills.trim().length > 1000) {
            errors.skills =
                "Skills description must be less than 1000 characters";
        }
    }

    // Experience validation (optional)
    if (
        experience &&
        typeof experience === "string" &&
        experience.trim().length > 2000
    ) {
        errors.experience =
            "Experience description must be less than 2000 characters";
    }

    // Motivation validation
    if (!motivation) {
        errors.motivation = "Motivation is required";
    } else if (typeof motivation === "string") {
        if (motivation.trim().length < 20) {
            errors.motivation =
                "Motivation must be at least 20 characters long";
        } else if (motivation.trim().length > 1000) {
            errors.motivation = "Motivation must be less than 1000 characters";
        }
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            success: false,
            message: "",
            errors,
        });
    }

    next();
};

// PA Part C: Candidate application endpoints with enhanced validation
router.post(
    "/",
    authenticateToken,
    requireUserType(["candidate"]),
    validateApplicationFields,
    applicationController.createApplication.bind(applicationController)
);

router.get(
    "/my-applications",
    authenticateToken,
    requireUserType(["candidate"]),
    applicationController.getMyCandidateApplications.bind(applicationController)
);

router.put(
    "/:id/candidate-response",
    authenticateToken,
    requireUserType(["candidate"]),
    applicationController.updateCandidateResponse.bind(applicationController)
);

router.delete(
    "/:id/candidate-response",
    authenticateToken,
    requireUserType(["candidate"]),
    applicationController.deleteCandidateResponse.bind(applicationController)
);

router.patch(
    "/:id/candidate-response",
    authenticateToken,
    requireUserType(["candidate"]),
    applicationController.editCorrespondenceMessage.bind(applicationController)
);

router.put(
    "/:id/withdraw",
    authenticateToken,
    requireUserType(["candidate"]),
    applicationController.withdrawApplication.bind(applicationController)
);

router.put(
    "/:id/message-reactions",
    authenticateToken,
    applicationController.toggleMessageReaction.bind(applicationController)
);

router.get(
    "/courses-and-roles",
    authenticateToken,
    requireUserType(["candidate"]),
    applicationController.getCoursesAndRoles.bind(applicationController)
);

// CR & DI Parts: Lecturer application endpoints with validation
router.get(
    "/lecturer",
    authenticateToken,
    requireUserType(["lecturer"]),
    validateLecturerFilters,
    applicationController.getApplicationsForLecturer.bind(applicationController)
);

router.get(
    "/statistics",
    authenticateToken,
    requireUserType(["lecturer"]),
    applicationController.getApplicationStatistics.bind(applicationController)
);

// Status update with comprehensive validation
router.put(
    "/:id/status",
    authenticateToken,
    requireUserType(["lecturer"]),
    sanitizeCommentData,
    validateStatusUpdate,
    validateLecturerApplicationAccess,
    applicationController.updateApplicationStatus.bind(applicationController)
);

// Comment submission endpoints
router.post(
    "/:id/comment",
    authenticateToken,
    requireUserType(["lecturer"]),
    sanitizeCommentData,
    validateCommentSubmission,
    validateLecturerApplicationAccess,
    applicationController.updateApplicationComment.bind(applicationController)
);

router.put(
    "/:id/comment",
    authenticateToken,
    requireUserType(["lecturer"]),
    sanitizeCommentData,
    validateCommentSubmission,
    validateLecturerApplicationAccess,
    applicationController.updateApplicationComment.bind(applicationController)
);

router.delete(
    "/:id/comment",
    authenticateToken,
    requireUserType(["lecturer"]),
    validateLecturerApplicationAccess,
    applicationController.deleteApplicationComment.bind(applicationController)
);

// Ranking operations
router.post(
    "/:id/ranking",
    authenticateToken,
    requireUserType(["lecturer"]),
    validateRankingOperation,
    validateLecturerApplicationAccess,
    applicationController.addApplicationToRanking.bind(applicationController)
);

router.put(
    "/:id/ranking",
    authenticateToken,
    requireUserType(["lecturer"]),
    validateRankingOperation,
    validateLecturerApplicationAccess,
    applicationController.updateApplicationRanking.bind(applicationController)
);

router.delete(
    "/:id/ranking",
    authenticateToken,
    requireUserType(["lecturer"]),
    validateLecturerApplicationAccess,
    applicationController.removeApplicationFromRanking.bind(
        applicationController
    )
);

router.get(
    "/:id/lecturer-notes",
    authenticateToken,
    requireUserType(["lecturer"]),
    validateLecturerApplicationAccess,
    applicationController.getLecturerNotes.bind(applicationController)
);

router.put(
    "/:id/lecturer-notes",
    authenticateToken,
    requireUserType(["lecturer"]),
    validateLecturerApplicationAccess,
    applicationController.updateLecturerNotes.bind(applicationController)
);

router.get(
    "/lecturer-assigned-courses",
    authenticateToken,
    requireUserType(["lecturer"]),
    applicationController.getAssignedCoursesForLecturer.bind(
        applicationController
    )
);


export default router;
