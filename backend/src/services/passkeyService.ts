import {
    generateAuthenticationOptions,
    generateRegistrationOptions,
    verifyAuthenticationResponse,
    verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
    AuthenticationResponseJSON,
    RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";
import { LessThan } from "typeorm";
import { AppDataSource } from "../config/database";
import { PasskeyChallenge } from "../entities/PasskeyChallenge";
import { PasskeyCredential } from "../entities/PasskeyCredential";
import { User, UserType } from "../entities/User";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const GENERIC_LOGIN_FAILURE = "Passkey could not be verified.";

function rpID(): string {
    const configured = process.env.WEBAUTHN_RP_ID?.trim();
    if (configured) return configured;
    const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
    return new URL(frontend).hostname;
}

function expectedOrigin(): string {
    const configured = process.env.WEBAUTHN_ORIGIN?.trim();
    if (configured) return configured;
    return process.env.FRONTEND_URL || "http://localhost:3000";
}

function challengeRepository() {
    return AppDataSource.getRepository(PasskeyChallenge);
}

function credentialRepository() {
    return AppDataSource.getRepository(PasskeyCredential);
}

function userRepository() {
    return AppDataSource.getRepository(User);
}

export function canUsePasskey(user: User | null): user is User {
    return Boolean(
        user &&
            !user.deletedAt &&
            !user.isBlocked &&
            user.userType !== UserType.ADMIN
    );
}

function readClientChallenge(clientDataJSON: string): string | null {
    try {
        const parsed = JSON.parse(
            Buffer.from(clientDataJSON, "base64url").toString("utf8")
        ) as { challenge?: unknown };
        return typeof parsed.challenge === "string" ? parsed.challenge : null;
    } catch {
        return null;
    }
}

async function consumeChallenge(
    challenge: string,
    purpose: "register" | "login",
    userId?: string
): Promise<boolean> {
    return AppDataSource.transaction(async (manager) => {
        const row = await manager.findOne(PasskeyChallenge, {
            where: { challenge, purpose },
            lock: { mode: "pessimistic_write" },
        });
        if (!row) return false;
        if (row.expiresAt.getTime() <= Date.now()) {
            await manager.delete(PasskeyChallenge, { id: row.id });
            return false;
        }
        if (purpose === "register" && row.userId !== userId) {
            return false;
        }
        await manager.delete(PasskeyChallenge, { id: row.id });
        return true;
    });
}

export class PasskeyService {
    static async registrationOptions(user: User) {
        if (!canUsePasskey(user)) {
            return {
                ok: false as const,
                status: 403,
                message: "Passkeys are not available for this account.",
            };
        }

        const existing = await credentialRepository().findOne({
            where: { userId: user.id },
        });
        if (existing) {
            return {
                ok: false as const,
                status: 409,
                message: "A passkey is already saved for this account.",
            };
        }

        const options = await generateRegistrationOptions({
            rpName: "TeachTeam",
            rpID: rpID(),
            userID: isoUint8Array.fromUTF8String(user.id),
            userName: user.email,
            userDisplayName: `${user.firstName} ${user.lastName}`.trim(),
            attestationType: "none",
            authenticatorSelection: {
                residentKey: "required",
                userVerification: "required",
            },
            timeout: 60_000,
        });

        await challengeRepository().delete({ userId: user.id, purpose: "register" });
        await challengeRepository().delete({ expiresAt: LessThan(new Date()) });
        const row = challengeRepository().create({
            userId: user.id,
            challenge: options.challenge,
            purpose: "register",
            expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
        });
        await challengeRepository().save(row);

        return { ok: true as const, options };
    }

    static async verifyRegistration(
        user: User,
        response: RegistrationResponseJSON
    ) {
        if (!canUsePasskey(user)) {
            return {
                ok: false as const,
                status: 403,
                message: "Passkeys are not available for this account.",
            };
        }
        const clientChallenge = readClientChallenge(
            response?.response?.clientDataJSON
        );
        if (!clientChallenge) {
            return {
                ok: false as const,
                status: 400,
                message: "Passkey could not be saved.",
            };
        }
        const fresh = await consumeChallenge(
            clientChallenge,
            "register",
            user.id
        );
        if (!fresh) {
            return {
                ok: false as const,
                status: 400,
                message: "Passkey could not be saved.",
            };
        }

        let verified;
        try {
            verified = await verifyRegistrationResponse({
                response,
                expectedChallenge: clientChallenge,
                expectedOrigin: expectedOrigin(),
                expectedRPID: rpID(),
                requireUserVerification: true,
            });
        } catch {
            return {
                ok: false as const,
                status: 400,
                message: "Passkey could not be saved.",
            };
        }
        if (!verified.verified || !verified.registrationInfo.userVerified) {
            return {
                ok: false as const,
                status: 400,
                message: "Passkey could not be saved.",
            };
        }

        const { credential } = verified.registrationInfo;
        const saved = await AppDataSource.transaction(async (manager) => {
            const count = await manager.count(PasskeyCredential, {
                where: { userId: user.id },
            });
            if (count > 0) return false;
            const record = manager.create(PasskeyCredential, {
                userId: user.id,
                credentialId: credential.id,
                publicKey: isoBase64URL.fromBuffer(credential.publicKey),
                counter: credential.counter,
                transports: credential.transports?.join(",") || null,
            });
            try {
                await manager.save(record);
            } catch {
                return false;
            }
            return true;
        });
        if (!saved) {
            return {
                ok: false as const,
                status: 409,
                message: "A passkey is already saved for this account.",
            };
        }
        return { ok: true as const };
    }

    static async loginOptions() {
        const options = await generateAuthenticationOptions({
            rpID: rpID(),
            userVerification: "required",
            timeout: 60_000,
        });
        await challengeRepository().delete({ expiresAt: LessThan(new Date()) });
        const row = challengeRepository().create({
            userId: null,
            challenge: options.challenge,
            purpose: "login",
            expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
        });
        await challengeRepository().save(row);
        return options;
    }

    static async verifyLogin(response: AuthenticationResponseJSON) {
        const clientChallenge = readClientChallenge(
            response?.response?.clientDataJSON
        );
        if (!clientChallenge || typeof response?.id !== "string") {
            return { ok: false as const, message: GENERIC_LOGIN_FAILURE };
        }
        const fresh = await consumeChallenge(clientChallenge, "login");
        if (!fresh) {
            return { ok: false as const, message: GENERIC_LOGIN_FAILURE };
        }

        const stored = await credentialRepository().findOne({
            where: { credentialId: response.id },
        });
        if (!stored) {
            return { ok: false as const, message: GENERIC_LOGIN_FAILURE };
        }
        const user = await userRepository().findOne({
            where: { id: stored.userId },
        });
        if (!canUsePasskey(user)) {
            return { ok: false as const, message: GENERIC_LOGIN_FAILURE };
        }

        let verified;
        try {
            verified = await verifyAuthenticationResponse({
                response,
                expectedChallenge: clientChallenge,
                expectedOrigin: expectedOrigin(),
                expectedRPID: rpID(),
                requireUserVerification: true,
                credential: {
                    id: stored.credentialId,
                    publicKey: isoBase64URL.toBuffer(stored.publicKey),
                    counter: stored.counter,
                    transports: stored.transports
                        ? (stored.transports.split(",") as never)
                        : undefined,
                },
            });
        } catch {
            return { ok: false as const, message: GENERIC_LOGIN_FAILURE };
        }
        if (!verified.verified || !verified.authenticationInfo.userVerified) {
            return { ok: false as const, message: GENERIC_LOGIN_FAILURE };
        }
        if (
            stored.counter > 0 &&
            verified.authenticationInfo.newCounter <= stored.counter
        ) {
            return { ok: false as const, message: GENERIC_LOGIN_FAILURE };
        }

        stored.counter = verified.authenticationInfo.newCounter;
        await credentialRepository().save(stored);
        return { ok: true as const, user };
    }

    static async hasPasskey(userId: string): Promise<boolean> {
        const existing = await credentialRepository().findOne({
            where: { userId },
        });
        return !!existing;
    }
}
