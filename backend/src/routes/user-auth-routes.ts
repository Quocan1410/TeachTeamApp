import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authenticateToken } from "../middleware/authMiddleware";
import { avatarUpload } from "../middleware/uploadMiddleware";
import {
    authRateLimiter,
    passwordResetRateLimiter,
} from "../middleware/rateLimiters";

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

// Enhanced signup validation
const validateSignupFields = (req: any, res: any, next: any) => {
    const { email, password, confirmPassword, firstName, lastName } = req.body;
    const errors: Record<string, string> = {};

    // Email validation
    if (!email) {
        errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Please enter a valid email address";
    } else {
        const emailLower = email.toLowerCase();
        const isValidDomain = emailLower.endsWith("@candidate.edu.au") ||
            emailLower.endsWith("@lecturer.edu.au") ||
            emailLower === "admin@admin.com";
        if (!isValidDomain) {
            errors.email = "Email must end with @candidate.edu.au (for candidates) or @lecturer.edu.au (for lecturers)";
        }
    }

    // Password validation
    if (!password) {
        errors.password = "Password is required";
    } else if (password.length < 8) {
        errors.password = "Password must be at least 8 characters long";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        errors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm password validation
    if (!confirmPassword) {
        errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
    }

    // Name validation
    if (!firstName) {
        errors.firstName = "First name is required";
    } else if (firstName.length < 1) {
        errors.firstName = "First name must be at least 1 character long";
    } else if (!/^[a-zA-Z\s]+$/.test(firstName)) {
        errors.firstName = "First name can only contain letters and spaces";
    }

    if (!lastName) {
        errors.lastName = "Last name is required";
    } else if (lastName.length < 1) {
        errors.lastName = "Last name must be at least 1 character long";
    } else if (!/^[a-zA-Z\s]+$/.test(lastName)) {
        errors.lastName = "Last name can only contain letters and spaces";
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

router.post(
    "/forgot-password",
    passwordResetRateLimiter,
    validateRequestBody(["email"]),
    async (req, res) => {
        await authController.forgotPassword(req, res);
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
