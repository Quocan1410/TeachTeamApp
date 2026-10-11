import {
    expectedOrigins,
    normalizeWebAuthnOrigin,
} from "../services/passkeyService";

describe("passkey origins", () => {
    const env = { ...process.env };

    afterEach(() => {
        process.env = { ...env };
    });

    it("strips trailing slashes", () => {
        expect(normalizeWebAuthnOrigin("https://teach-team-app.vercel.app/")).toBe(
            "https://teach-team-app.vercel.app"
        );
    });

    it("accepts the vercel origin when rp id is set but FRONTEND_URL is localhost", () => {
        process.env.WEBAUTHN_RP_ID = "teach-team-app.vercel.app";
        process.env.FRONTEND_URL = "http://localhost:3000";
        delete process.env.WEBAUTHN_ORIGIN;
        delete process.env.ALLOWED_ORIGINS;

        const origins = expectedOrigins("https://teach-team-app.vercel.app");
        expect(origins).toContain("https://teach-team-app.vercel.app");
        expect(origins).toContain("http://localhost:3000");
    });

    it("ignores unrelated request origins", () => {
        process.env.WEBAUTHN_RP_ID = "teach-team-app.vercel.app";
        process.env.FRONTEND_URL = "https://teach-team-app.vercel.app";
        delete process.env.WEBAUTHN_ORIGIN;
        delete process.env.ALLOWED_ORIGINS;

        const origins = expectedOrigins("https://evil.example");
        expect(origins).not.toContain("https://evil.example");
        expect(origins).toContain("https://teach-team-app.vercel.app");
    });
});
