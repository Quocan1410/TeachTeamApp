import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { AppDataSource } from "../config/database";
import { User, UserType } from "../entities/User";
import { Course } from "../entities/Course";
import { CourseAssignment } from "../entities/CourseAssignment";
import {
    validateSigninData,
    validateForgotPasswordEmail,
    validateResetPasswordData,
    validateChangePasswordData,
    getUserTypeFromEmail,
} from "../utils/validation";
import { PasswordResetService } from "../services/PasswordResetService";
import { SecurityQuestionService } from "../services/SecurityQuestionService";
import { SECURITY_QUESTIONS } from "../config/securityQuestions";
import { RefreshTokenService } from "../services/RefreshTokenService";
import { NotificationService } from "../services/NotificationService";
import { NotificationType } from "../entities/Notification";
import {
    buildAvatarPublicPath,
    deleteAvatarFileIfExists,
    getAvatarMimeType,
    resolveAvatarFilePath,
} from "../utils/avatarUtils";
import {
    clearAuthCookie,
    setAuthCookie,
    setRefreshCookie,
    getRefreshTokenFromRequest,
} from "../utils/authCookie";
import { enqueueEmail } from "../services/emailQueue";
import { AuthService } from "../services/authService";

interface AssignedCourse {
    id: number;
    courseCode: string;
    courseName: string;
    semester: string;
    assignedAt: Date;
}

export class AuthController {
    private userRepository = AppDataSource.getRepository(User);
    private courseAssignmentRepository =
        AppDataSource.getRepository(CourseAssignment);
    private passwordResetService = new PasswordResetService();
    private securityQuestionService = new SecurityQuestionService();

    private async issueUserSession(
        res: Response,
        user: User
    ): Promise<void> {
        setAuthCookie(res, {
            userId: user.id,
            email: user.email,
            userType: user.userType,
        });
        const refreshToken = await RefreshTokenService.issue(user.id);
        setRefreshCookie(res, refreshToken);
    }

    async signup(req: Request, res: Response): Promise<void> {
        try {
            const result = await AuthService.registerUser(req.body);
            if (!result.success || !result.data?.user) {
                res.status(result.statusCode).json({
                    success: false,
                    message: result.message,
                    errors: result.errors,
                });
                return;
            }

            const savedUser = await this.userRepository.findOne({
                where: { id: result.data.user.id },
            });
            if (!savedUser) {
                res.status(500).json({
                    success: false,
                    message: "Internal server error during registration",
                });
                return;
            }

            await this.issueUserSession(res, savedUser);

            res.status(result.statusCode).json({
                success: true,
                message: result.message,
                data: result.data,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error during registration",
            });
        }
    }

    async signin(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            // Validate input data
            const validation = validateSigninData(req.body);
            if (!validation.isValid) {
                res.status(400).json({
                    success: false,
                    message: "",
                    errors: validation.errors,
                });
                return;
            }

            // Find user by email
            const user = await this.userRepository.findOne({
                where: { email },
            });

            if (!user || user.deletedAt) {
                res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
                return;
            }

            // Check if user is blocked
            if (user.isBlocked) {
                res.status(403).json({
                    success: false,
                    message:
                        "Your account has been blocked. Please contact administrator.",
                });
                return;
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(
                password,
                user.password
            );

            if (!isPasswordValid) {
                res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
                return;
            }

            if (user.userType === UserType.ADMIN) {
                const adminPanelUrl =
                    process.env.ADMIN_FRONTEND_URL || "http://localhost:3001";
                res.status(403).json({
                    success: false,
                    message: `Admin accounts must sign in at the admin panel (${adminPanelUrl}).`,
                });
                return;
            }

            await this.issueUserSession(res, user);

            // Return success response (exclude password)
            const { password: _, ...userWithoutPassword } = user;
            res.status(200).json({
                success: true,
                message: "Login successful",
                data: {
                    user: userWithoutPassword,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error during login",
            });
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        try {
            const refreshToken = getRefreshTokenFromRequest(req);
            if (refreshToken) {
                await RefreshTokenService.revoke(refreshToken);
            }
            clearAuthCookie(res);
            res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error during logout",
            });
        }
    }

    async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const rawRefresh = getRefreshTokenFromRequest(req);
            if (!rawRefresh) {
                res.status(401).json({
                    success: false,
                    message: "Refresh token is required",
                    code: "REFRESH_TOKEN_REQUIRED",
                });
                return;
            }

            const rotated = await RefreshTokenService.rotate(rawRefresh);
            if (!rotated) {
                clearAuthCookie(res);
                res.status(401).json({
                    success: false,
                    message: "Invalid or expired refresh token",
                    code: "REFRESH_TOKEN_INVALID",
                });
                return;
            }

            const user = await this.userRepository.findOne({
                where: { id: rotated.userId },
            });

            if (!user || user.isBlocked || user.deletedAt) {
                clearAuthCookie(res);
                res.status(401).json({
                    success: false,
                    message: "User account unavailable",
                    code: "REFRESH_TOKEN_INVALID",
                });
                return;
            }

            if (user.userType === UserType.ADMIN) {
                clearAuthCookie(res);
                res.status(403).json({
                    success: false,
                    message: "Admin accounts use the admin panel",
                });
                return;
            }

            setAuthCookie(res, {
                userId: user.id,
                email: user.email,
                userType: user.userType,
            });
            setRefreshCookie(res, rotated.newToken);

            const { password: _, ...userWithoutPassword } = user;
            res.status(200).json({
                success: true,
                message: "Token refreshed",
                data: { user: userWithoutPassword },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Unable to refresh session",
            });
        }
    }

    async changePassword(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }

            const result = await AuthService.changePassword(userId, req.body);
            if (!result.success) {
                res.status(result.statusCode).json({
                    success: false,
                    message: result.message,
                    errors: result.errors,
                });
                return;
            }

            const user = await this.userRepository.findOne({
                where: { id: userId },
            });
            if (user) {
                await this.issueUserSession(res, user);
            }

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Unable to change password",
            });
        }
    }

    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }

            const user = await this.userRepository.findOne({
                where: { id: userId },
            });

            if (!user) {
                res.status(401).json({
                    success: false,
                    message:
                        "Session expired or account no longer exists. Please sign in again.",
                });
                return;
            }

            // Return user profile without password
            const { password: _, ...userProfile } = user;

            // If user is a lecturer, include their assigned courses
            let assignedCourses: AssignedCourse[] = [];
            if (user.userType === UserType.LECTURER) {

                try {
                    const courseAssignments =
                        await this.courseAssignmentRepository.find({
                            where: { lecturerId: userId },
                            relations: ["course"],
                            order: { course: { courseCode: "ASC" } },
                        });

                    assignedCourses = courseAssignments.map((assignment) => ({
                        id: assignment.course.id,
                        courseCode: assignment.course.courseCode,
                        courseName: assignment.course.courseName,
                        semester: assignment.course.semester,
                        assignedAt: assignment.assignedAt,
                    }));
                } catch (courseError) {
                    // Keep assignedCourses as empty array if there's an error
                    assignedCourses = [];
                }
            }

            res.status(200).json({
                success: true,
                message: "Profile retrieved successfully",
                data: {
                    user: userProfile,
                    assignedCourses: assignedCourses,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error while fetching profile",
            });
        }
    }

    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }

            const result = await AuthService.updateProfile(userId, req.body);
            res.status(result.statusCode).json({
                success: result.success,
                message: result.message,
                data: result.data,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error while updating profile",
            });
        }
    }

    async updateTheme(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const theme = req.body.theme;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }

            if (theme !== "light" && theme !== "dark") {
                res.status(400).json({
                    success: false,
                    message: "Theme must be 'light' or 'dark'",
                });
                return;
            }

            const user = await this.userRepository.findOne({
                where: { id: userId },
            });

            if (!user) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }

            user.theme = theme;
            const updatedUser = await this.userRepository.save(user);
            const { password: _, ...userProfile } = updatedUser;

            res.status(200).json({
                success: true,
                message: "Theme updated",
                data: { user: userProfile },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error while updating theme",
            });
        }
    }

    async uploadAvatar(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }

            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: "Avatar image file is required",
                });
                return;
            }

            const user = await this.userRepository.findOne({
                where: { id: userId },
            });

            if (!user) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }

            const previousAvatarUrl = user.avatarUrl;
            const avatarUrl = buildAvatarPublicPath(req.file.filename);

            user.avatarUrl = avatarUrl;
            const updatedUser = await this.userRepository.save(user);

            deleteAvatarFileIfExists(previousAvatarUrl);

            const { password: _, ...userWithoutPassword } = updatedUser;

            res.status(200).json({
                success: true,
                message: "Avatar updated successfully",
                data: {
                    user: userWithoutPassword,
                },
            });
        } catch (error) {
            const err = error as {
                code?: string;
                errno?: number;
                message?: string;
                driverError?: { code?: string; sqlMessage?: string };
            };

            if (
                err.code === "ENOSPC" ||
                err.errno === -4055 ||
                err.message?.includes("ENOSPC")
            ) {
                res.status(507).json({
                    success: false,
                    message:
                        "Disk is full. Free space on your drive and try again.",
                });
                return;
            }

            if (
                err.code === "ER_BAD_FIELD_ERROR" ||
                err.driverError?.code === "ER_BAD_FIELD_ERROR" ||
                err.message?.includes("avatarUrl")
            ) {
                res.status(500).json({
                    success: false,
                    message:
                        "Database is missing avatarUrl column. Restart the backend server.",
                });
                return;
            }

            res.status(500).json({
                success: false,
                message: "Internal server error while uploading avatar",
            });
        }
    }

    async deleteAvatar(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }

            const user = await this.userRepository.findOne({
                where: { id: userId },
            });

            if (!user) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }

            const previousAvatarUrl = user.avatarUrl;
            user.avatarUrl = null;
            const updatedUser = await this.userRepository.save(user);

            deleteAvatarFileIfExists(previousAvatarUrl);

            const { password: _, ...userWithoutPassword } = updatedUser;

            res.status(200).json({
                success: true,
                message: "Avatar removed successfully",
                data: {
                    user: userWithoutPassword,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error while removing avatar",
            });
        }
    }

    async getMyAvatar(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }

            const user = await this.userRepository.findOne({
                where: { id: userId },
            });

            if (!user?.avatarUrl) {
                res.status(404).json({
                    success: false,
                    message: "No avatar uploaded",
                });
                return;
            }

            const filePath = resolveAvatarFilePath(user.avatarUrl);

            if (!filePath) {
                res.status(404).json({
                    success: false,
                    message: "Avatar file not found",
                });
                return;
            }

            res.setHeader("Content-Type", getAvatarMimeType(filePath));
            res.setHeader("Cache-Control", "private, max-age=300");
            fs.createReadStream(filePath).pipe(res);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to load avatar",
            });
        }
    }

    /** Avatar of another user (e.g. lecturer in correspondence) — requires login. */
    async getUserAvatar(req: Request, res: Response): Promise<void> {
        try {
            const requesterId = (req as { user?: { userId?: number } }).user
                ?.userId;
            if (!requesterId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }

            const targetUserId = parseInt(req.params.userId, 10);
            if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
                res.status(400).json({
                    success: false,
                    message: "Invalid user id",
                });
                return;
            }

            const user = await this.userRepository.findOne({
                where: { id: targetUserId },
            });

            if (!user?.avatarUrl) {
                res.status(404).json({
                    success: false,
                    message: "No avatar uploaded",
                });
                return;
            }

            const filePath = resolveAvatarFilePath(user.avatarUrl);
            if (!filePath) {
                res.status(404).json({
                    success: false,
                    message: "Avatar file not found",
                });
                return;
            }

            res.setHeader("Content-Type", getAvatarMimeType(filePath));
            res.setHeader("Cache-Control", "private, max-age=300");
            fs.createReadStream(filePath).pipe(res);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to load avatar",
            });
        }
    }

    getSecurityQuestions(_req: Request, res: Response): void {
        res.status(200).json({
            success: true,
            data: { questions: SECURITY_QUESTIONS },
        });
    }

    async forgotPasswordChallenge(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
            const validation = validateForgotPasswordEmail(email || "");
            if (!validation.isValid) {
                res.status(400).json({
                    success: false,
                    message: "",
                    errors: validation.errors,
                });
                return;
            }

            const result =
                await this.securityQuestionService.getChallengeForEmail(email);

            if (!result.ok) {
                res.status(400).json({
                    success: false,
                    message: result.message,
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: { questions: result.questions },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Unable to start password recovery",
            });
        }
    }

    /** Email reset link — queued via cron worker (SMTP optional in dev). */
    async forgotPasswordEmail(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
            const validation = validateForgotPasswordEmail(email || "");
            if (!validation.isValid) {
                res.status(400).json({
                    success: false,
                    message: "",
                    errors: validation.errors,
                });
                return;
            }

            const normalized = String(email).trim().toLowerCase();
            const user = await this.userRepository.findOne({
                where: { email: normalized },
            });

            if (
                user &&
                user.userType !== UserType.ADMIN &&
                !user.isBlocked &&
                !user.deletedAt
            ) {
                const { resetUrl } =
                    await this.passwordResetService.createResetTokenForUser(
                        user.id
                    );
                enqueueEmail({
                    type: "password_reset",
                    to: user.email,
                    resetUrl,
                });
            }

            res.status(200).json({
                success: true,
                message:
                    "If an account exists for that email, a reset link has been queued.",
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Unable to queue password reset email",
            });
        }
    }

    async forgotPasswordVerify(req: Request, res: Response): Promise<void> {
        try {
            const { email, securityAnswers } = req.body;
            const emailValidation = validateForgotPasswordEmail(email || "");
            if (!emailValidation.isValid) {
                res.status(400).json({
                    success: false,
                    message: "",
                    errors: emailValidation.errors,
                });
                return;
            }

            const result =
                await this.securityQuestionService.verifyAndIssueResetToken(
                    email,
                    securityAnswers
                );

            if (!result.ok) {
                res.status(400).json({
                    success: false,
                    message: result.message,
                    errors: result.errors,
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: "Answers verified. You can set a new password.",
                data: {
                    resetToken: result.resetToken,
                    resetUrl: result.resetUrl,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Unable to verify security answers",
            });
        }
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const { token, password, confirmPassword } = req.body;
            const validation = validateResetPasswordData({
                token,
                password,
                confirmPassword,
            });
            if (!validation.isValid) {
                res.status(400).json({
                    success: false,
                    message: "",
                    errors: validation.errors,
                });
                return;
            }

            const result = await this.passwordResetService.resetPassword(
                token,
                password
            );

            if (!result.success) {
                res.status(400).json({
                    success: false,
                    message: result.message,
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Unable to reset password",
            });
        }
    }
}
