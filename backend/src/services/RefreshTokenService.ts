import crypto from "crypto";
import { AppDataSource } from "../config/database";
import { RefreshToken } from "../entities/RefreshToken";

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const hashToken = (token: string): string =>
    crypto.createHash("sha256").update(token).digest("hex");

const generateToken = (): string => crypto.randomBytes(32).toString("hex");

export class RefreshTokenService {
    private static getRepository() {
        return AppDataSource.getRepository(RefreshToken);
    }

    static async issue(userId: number): Promise<string> {
        const rawToken = generateToken();
        const repo = this.getRepository();
        const row = repo.create({
            userId,
            tokenHash: hashToken(rawToken),
            expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
            revokedAt: null,
        });
        await repo.save(row);
        return rawToken;
    }

    static async rotate(rawToken: string): Promise<{ userId: number; newToken: string } | null> {
        const repo = this.getRepository();
        const tokenHash = hashToken(rawToken);
        const existing = await repo.findOne({ where: { tokenHash } });

        if (
            !existing ||
            existing.revokedAt ||
            existing.expiresAt.getTime() <= Date.now()
        ) {
            return null;
        }

        existing.revokedAt = new Date();
        await repo.save(existing);

        const newToken = await this.issue(existing.userId);
        return { userId: existing.userId, newToken };
    }

    static async revoke(rawToken: string): Promise<void> {
        const repo = this.getRepository();
        const tokenHash = hashToken(rawToken);
        const existing = await repo.findOne({ where: { tokenHash } });
        if (!existing || existing.revokedAt) {
            return;
        }
        existing.revokedAt = new Date();
        await repo.save(existing);
    }

    static async revokeAllForUser(userId: number): Promise<void> {
        const repo = this.getRepository();
        await repo
            .createQueryBuilder()
            .update(RefreshToken)
            .set({ revokedAt: new Date() })
            .where("userId = :userId", { userId })
            .andWhere("revokedAt IS NULL")
            .execute();
    }
}
