import crypto from "crypto";
import bcrypt from "bcryptjs";
import { LessThan, IsNull } from "typeorm";
import { AppDataSource } from "../config/database";
import { PasswordResetToken } from "../entities/PasswordResetToken";
import { User, UserType } from "../entities/User";
import { RefreshTokenService } from "./RefreshTokenService";

const TOKEN_BYTES = 32;
const DEFAULT_TTL_MINUTES = 60;

function hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function getResetTtlMs(): number {
    const minutes = parseInt(
        process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || String(DEFAULT_TTL_MINUTES),
        10
    );
    return (Number.isFinite(minutes) && minutes > 0 ? minutes : DEFAULT_TTL_MINUTES) *
        60 *
        1000;
}

export function buildResetUrl(rawToken: string): string {
    const base =
        process.env.FRONTEND_URL?.replace(/\/$/, "") ||
        "http://localhost:3000";
    return `${base}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

export class PasswordResetService {
    private tokenRepo = AppDataSource.getRepository(PasswordResetToken);
    private userRepo = AppDataSource.getRepository(User);

    async createResetTokenForUser(userId: number): Promise<{
        rawToken: string;
        resetUrl: string;
    }> {
        await this.tokenRepo.update(
            { userId, usedAt: IsNull() },
            { usedAt: new Date() }
        );

        const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("hex");
        const expiresAt = new Date(Date.now() + getResetTtlMs());

        await this.tokenRepo.save(
            this.tokenRepo.create({
                userId,
                tokenHash: hashToken(rawToken),
                expiresAt,
                usedAt: null,
            })
        );

        return {
            rawToken,
            resetUrl: buildResetUrl(rawToken),
        };
    }

    async resetPassword(
        rawToken: string,
        newPassword: string
    ): Promise<{ success: boolean; message: string }> {
        const tokenHash = hashToken(rawToken.trim());
        const record = await this.tokenRepo.findOne({
            where: { tokenHash },
            relations: ["user"],
        });

        if (!record || record.usedAt) {
            return {
                success: false,
                message: "Invalid or expired reset link. Please request a new one.",
            };
        }

        if (record.expiresAt.getTime() < Date.now()) {
            return {
                success: false,
                message: "This reset link has expired. Please request a new one.",
            };
        }

        const user = record.user;
        if (!user || user.userType === UserType.ADMIN || user.isBlocked) {
            return {
                success: false,
                message: "Invalid or expired reset link. Please request a new one.",
            };
        }

        const saltRounds = 12;
        user.password = await bcrypt.hash(newPassword, saltRounds);
        await this.userRepo.save(user);
        await RefreshTokenService.revokeAllForUser(user.id);

        record.usedAt = new Date();
        await this.tokenRepo.save(record);

        await this.tokenRepo.update(
            { userId: user.id, usedAt: IsNull() },
            { usedAt: new Date() }
        );

        return {
            success: true,
            message: "Password updated successfully. You can sign in now.",
        };
    }

    async purgeExpiredTokens(): Promise<void> {
        await this.tokenRepo.delete({
            expiresAt: LessThan(new Date()),
        });
    }
}
