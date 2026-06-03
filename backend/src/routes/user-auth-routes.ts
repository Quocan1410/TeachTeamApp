import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authenticateToken } from "../middleware/authMiddleware";
import { avatarUpload } from "../middleware/uploadMiddleware";
import {
    authRateLimiter,
    passwordResetRateLimiter,
} from "../middleware/rateLimiters";
import { validateSignupData } from "../utils/validation";

const router = Router();
const authController = new AuthController();

// Enhanced validation middleware
const validateRequestBody = (requiredFields: string[]) => {
    return (req: any, res: any, next: any) => {
        const errors: Record<string, string> = {};

        for (const field of requiredFields) {
            if (!req.body[field] || (typeof req.body[field] === 'string' && req.body[field].trim() === '')) {
                errors[field] = `${field} is required`;
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
};

// Signup validation — single source of truth shared with AuthController
const validateSignupFields = (req: any, res: any, next: any) => {
    const validation = validateSignupData(req.body);
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: "",
            errors: validation.errors,
        });
    }
    next();
};

const validateProfileFields = (req: any, res: any, next: any) => {
    const { firstName, lastName, honorific } = req.body;
    const errors: Record<string, string> = {};

    if (!firstName || (typeof firstName === "string" && firstName.trim() === "")) {
        errors.firstName = "First name is required";
    } else if (firstName.length < 1) {
        errors.firstName = "First name must be at least 1 character long";
    } else if (!/^[a-zA-Z\s]+$/.test(firstName)) {
        errors.firstName = "First name can only contain letters and spaces";
    }

    if (!lastName || (typeof lastName === "string" && lastName.trim() === "")) {
        errors.lastName = "Last name is required";
    } else if (lastName.length < 1) {
        errors.lastName = "Last name must be at least 1 character long";
    } else if (!/^[a-zA-Z\s]+$/.test(lastName)) {
        errors.lastName = "Last name can only contain letters and spaces";
    }

    if (honorific !== undefined && honorific !== null && honorific !== "") {
        const valid = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."];
        if (typeof honorific !== "string" || !valid.includes(honorific.trim())) {
            errors.honorific = "Please choose a valid title";
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

// Public routes with enhanced validation
router.post("/signup", authRateLimiter, validateSignupFields, async (req, res) => {
    await authController.signup(req, res);
});

router.post("/signin", authRateLimiter, validateRequestBody(["email", "password"]), async (req, res) => {
    await authController.signin(req, res);
});

router.post("/logout", async (req, res) => {
    await authController.logout(req, res);
});

router.post("/refresh", authRateLimiter, async (req, res) => {
    await authController.refreshToken(req, res);
});

router.get("/security-questions", (req, res) => {
    authController.getSecurityQuestions(req, res);
});

router.post(
    "/forgot-password/challenge",
    passwordResetRateLimiter,
    validateRequestBody(["email"]),
    async (req, res) => {
        await authController.forgotPasswordChallenge(req, res);
    }
);

router.post(
    "/forgot-password/verify",
    passwordResetRateLimiter,
    async (req, res) => {
        await authController.forgotPasswordVerify(req, res);
    }
);

router.post(
    "/reset-password",
    passwordResetRateLimiter,
    validateRequestBody(["token", "password", "confirmPassword"]),
    async (req, res) => {
        await authController.resetPassword(req, res);
    }
);

// Protected routes
router.get("/profile", authenticateToken, async (req, res) => {
    await authController.getProfile(req, res);
});

router.put("/profile", authenticateToken, validateProfileFields, async (req, res) => {
    await authController.updateProfile(req, res);
});

router.post(
    "/change-password",
    authenticateToken,
    validateRequestBody(["currentPassword", "newPassword", "confirmPassword"]),
    async (req, res) => {
        await authController.changePassword(req, res);
    }
);

router.patch("/theme", authenticateToken, async (req, res) => {
    await authController.updateTheme(req, res);
});

router.get("/avatar/image", authenticateToken, async (req, res) => {
    await authController.getMyAvatar(req, res);
});

router.get("/users/:userId/avatar", authenticateToken, async (req, res) => {
    await authController.getUserAvatar(req, res);
});

router.post("/avatar", authenticateToken, (req, res) => {
    avatarUpload.single("avatar")(req, res, async (err) => {
        if (err) {
            const uploadErr = err as { code?: string; message?: string };
            if (uploadErr.code === "ENOSPC") {
                res.status(507).json({
                    success: false,
                    message:
                        "Disk is full. Free space on your drive and try again.",
                });
                return;
            }
            res.status(400).json({
                success: false,
                message: err.message || "Invalid avatar upload",
            });
            return;
        }
        await authController.uploadAvatar(req, res);
    });
});

router.delete("/avatar", authenticateToken, async (req, res) => {
    await authController.deleteAvatar(req, res);
});

export default router;
