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
            const { email, password, firstName, lastName, userType, honorific } =
                req.body;

            // Automatically determine userType from email domain if not provided
            let finalUserType = userType;
            if (!finalUserType) {
                finalUserType = getUserTypeFromEmail(email);
                if (!finalUserType) {
                    res.status(400).json({
                        success: false,
                        message: "Invalid email domain",
                        errors: {
                            email: "Email must end with @candidate.edu.au (for candidates) or @lecturer.edu.au (for lecturers)",
                        },
                    });
                    return;
                }
                // Set the userType in the request body for validation
                req.body.userType = finalUserType;
            } else {
                // If userType is provided, verify it matches the email domain
                const userTypeFromEmail = getUserTypeFromEmail(email);
                if (userTypeFromEmail && userTypeFromEmail !== finalUserType) {
                    const expectedDomain =
                        userTypeFromEmail === UserType.CANDIDATE
                            ? "@candidate.edu.au"
                            : "@lecturer.edu.au";
                    res.status(400).json({
                        success: false,
                        message: "User type does not match email domain",
                        errors: {
                            email: `Email domain does not match selected user type. Use ${expectedDomain} for ${userTypeFromEmail}s`,
                        },
                    });
                    return;
                }
            }

            if (finalUserType === UserType.ADMIN) {
                res.status(403).json({
                    success: false,
                    message:
                        "Admin accounts cannot be created via signup. Sign in at the admin panel.",
                });
                return;
            }

            // Check if user already exists
            const existingUser = await this.userRepository.findOne({
                where: { email },
            });

            if (existingUser) {
                res.status(409).json({
                    success: false,
                    message: "User with this email already exists",
                });
                return;
            }

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const resolvedHonorific =
                typeof honorific === "string" && honorific.trim()
                    ? honorific.trim()
                    : finalUserType === UserType.LECTURER
                      ? "Dr."
                      : "Mr.";

            const securityValidation =
                SecurityQuestionService.validateSecurityAnswersInput(
                    req.body.securityAnswers
                );

            // Create new user with the final userType
            const newUser = this.userRepository.create({
                email,
                password: hashedPassword,
                firstName,
                lastName,
                userType: finalUserType as UserType,
                honorific: resolvedHonorific,
            });

            const savedUser = await this.userRepository.save(newUser);

            try {
                await this.securityQuestionService.saveAnswers(
                    savedUser.id,
                    securityValidation.parsed
                );
            } catch {
                await this.userRepository.delete({ id: savedUser.id });
                res.status(500).json({
                    success: false,
                    message: "Unable to save security questions. Please try again.",
                });
                return;
            }

            if (finalUserType !== UserType.ADMIN) {
                await NotificationService.notifyAdmins({
                    type: NotificationType.USER_REGISTERED,
                    title: "New user registered",
                    message: `${savedUser.firstName} ${savedUser.lastName} (${savedUser.email}) joined as ${finalUserType}`,
                    link: "/dashboard/users",
                    metadata: {
                        userId: savedUser.id,
                        userType: finalUserType,
                    },
                });
            }

            await this.issueUserSession(res, savedUser);

            // Return success response (exclude password)
            const { password: _, ...userWithoutPassword } = savedUser;

            res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: {
                    user: userWithoutPassword,
                },
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

            if (!user) {
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

            if (!user || user.isBlocked) {
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

            const { currentPassword, newPassword, confirmPassword } = req.body;
            const validation = validateChangePasswordData({
                currentPassword,
                newPassword,
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

            if (user.userType === UserType.ADMIN) {
                res.status(403).json({
                    success: false,
                    message: "Admin password is managed in the admin panel",
                });
                return;
            }

            const matches = await bcrypt.compare(
                currentPassword,
                user.password
            );
            if (!matches) {
                res.status(400).json({
                    success: false,
                    message: "",
                    errors: { currentPassword: "Current password is incorrect" },
                });
                return;
            }

            if (currentPassword === newPassword) {
                res.status(400).json({
                    success: false,
                    message: "",
                    errors: {
                        newPassword:
                            "New password must be different from current password",
                    },
                });
                return;
            }

            user.password = await bcrypt.hash(newPassword, 12);
            await this.userRepository.save(user);
            await RefreshTokenService.revokeAllForUser(user.id);

            await this.issueUserSession(res, user);

            res.status(200).json({
                success: true,
                message: "Password changed successfully",
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

            const { firstName, lastName, honorific } = req.body;

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

            if (user.isBlocked) {
                res.status(403).json({
                    success: false,
                    message: "Blocked accounts cannot update their profile",
                });
                return;
            }

            user.firstName = firstName.trim();
            user.lastName = lastName.trim();

            if (typeof honorific === "string" && honorific.trim()) {
                const trimmed = honorific.trim();
                const candidateTitles = new Set(["Mr.", "Ms.", "Mrs."]);
                const lecturerTitles = new Set(["Dr.", "Prof."]);

                if (
                    user.userType === UserType.CANDIDATE &&
                    candidateTitles.has(trimmed)
                ) {
                    user.honorific = trimmed;
                } else if (
                    user.userType === UserType.LECTURER &&
                    lecturerTitles.has(trimmed)
                ) {
                    user.honorific = trimmed;
                }
            }

            const updatedUser = await this.userRepository.save(user);
            const { password: _, ...userProfile } = updatedUser;

            res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: { user: userProfile },
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
