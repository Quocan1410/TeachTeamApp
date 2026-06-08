import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/database";
import { User, UserType } from "../entities/User";
import {
    getUserTypeFromEmail,
    validateChangePasswordData,
} from "../utils/validation";
import { SecurityQuestionService } from "./SecurityQuestionService";
import { NotificationService } from "./NotificationService";
import { NotificationType } from "../entities/Notification";
import { RefreshTokenService } from "./RefreshTokenService";

export type AuthServiceResult<T = Record<string, unknown>> = {
    success: boolean;
    statusCode: number;
    message?: string;
    errors?: Record<string, string>;
    data?: T;
};

export interface SignupPayload {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType?: UserType;
    honorific?: string;
    securityAnswers?: unknown;
}

export class AuthService {
    private static userRepository = AppDataSource.getRepository(User);
    private static securityQuestionService = new SecurityQuestionService();

    static async registerUser(
        payload: SignupPayload
    ): Promise<AuthServiceResult<{ user: User }>> {
        let finalUserType = payload.userType;
        const email = payload.email;

        if (!finalUserType) {
            const inferred = getUserTypeFromEmail(email);
            if (!inferred) {
                return {
                    success: false,
                    statusCode: 400,
                    message: "Invalid email domain",
                    errors: {
                        email: "Email must end with @candidate.edu.au (for candidates) or @lecturer.edu.au (for lecturers)",
                    },
                };
            }
            finalUserType = inferred;
        } else {
            const userTypeFromEmail = getUserTypeFromEmail(email);
            if (userTypeFromEmail && userTypeFromEmail !== finalUserType) {
                const expectedDomain =
                    userTypeFromEmail === UserType.CANDIDATE
                        ? "@candidate.edu.au"
                        : "@lecturer.edu.au";
                return {
                    success: false,
                    statusCode: 400,
                    message: "User type does not match email domain",
                    errors: {
                        email: `Email domain does not match selected user type. Use ${expectedDomain} for ${userTypeFromEmail}s`,
                    },
                };
            }
        }

        if (finalUserType === UserType.ADMIN) {
            return {
                success: false,
                statusCode: 403,
                message:
                    "Admin accounts cannot be created via signup. Sign in at the admin panel.",
            };
        }

        const existingUser = await this.userRepository.findOne({
            where: { email },
        });
        if (existingUser) {
            return {
                success: false,
                statusCode: 409,
                message: "User with this email already exists",
            };
        }

        const securityValidation =
            SecurityQuestionService.validateSecurityAnswersInput(
                payload.securityAnswers
            );
        if (!securityValidation.isValid) {
            return {
                success: false,
                statusCode: 400,
                message: "Invalid security answers",
                errors: securityValidation.errors,
            };
        }

        const hashedPassword = await bcrypt.hash(payload.password, 12);
        const resolvedHonorific =
            typeof payload.honorific === "string" && payload.honorific.trim()
                ? payload.honorific.trim()
                : finalUserType === UserType.LECTURER
                  ? "Dr."
                  : "Mr.";

        const newUser = this.userRepository.create({
            email,
            password: hashedPassword,
            firstName: payload.firstName,
            lastName: payload.lastName,
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
            return {
                success: false,
                statusCode: 500,
                message: "Unable to save security questions. Please try again.",
            };
        }

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

        const { password: _, ...userWithoutPassword } = savedUser;
        return {
            success: true,
            statusCode: 201,
            message: "User registered successfully",
            data: { user: userWithoutPassword as User },
        };
    }

    static async changePassword(
        userId: number,
        body: {
            currentPassword: string;
            newPassword: string;
            confirmPassword: string;
        }
    ): Promise<AuthServiceResult> {
        const validation = validateChangePasswordData(body);
        if (!validation.isValid) {
            return {
                success: false,
                statusCode: 400,
                message: "",
                errors: validation.errors,
            };
        }

        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            return {
                success: false,
                statusCode: 404,
                message: "User not found",
            };
        }

        if (user.userType === UserType.ADMIN) {
            return {
                success: false,
                statusCode: 403,
                message: "Admin password is managed in the admin panel",
            };
        }

        const matches = await bcrypt.compare(
            body.currentPassword,
            user.password
        );
        if (!matches) {
            return {
                success: false,
                statusCode: 400,
                message: "",
                errors: { currentPassword: "Current password is incorrect" },
            };
        }

        if (body.currentPassword === body.newPassword) {
            return {
                success: false,
                statusCode: 400,
                message: "",
                errors: {
                    newPassword:
                        "New password must be different from current password",
                },
            };
        }

        user.password = await bcrypt.hash(body.newPassword, 12);
        await this.userRepository.save(user);
        await RefreshTokenService.revokeAllForUser(user.id);

        return {
            success: true,
            statusCode: 200,
            message: "Password changed successfully",
        };
    }

    static async updateProfile(
        userId: number,
        body: { firstName: string; lastName: string; honorific?: string }
    ): Promise<AuthServiceResult<{ user: User }>> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            return {
                success: false,
                statusCode: 404,
                message: "User not found",
            };
        }

        if (user.isBlocked) {
            return {
                success: false,
                statusCode: 403,
                message: "Blocked accounts cannot update their profile",
            };
        }

        user.firstName = body.firstName.trim();
        user.lastName = body.lastName.trim();

        if (typeof body.honorific === "string" && body.honorific.trim()) {
            const trimmed = body.honorific.trim();
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

        return {
            success: true,
            statusCode: 200,
            message: "Profile updated successfully",
            data: { user: userProfile as User },
        };
    }
}
