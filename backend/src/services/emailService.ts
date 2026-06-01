import nodemailer from "nodemailer";

const isSmtpConfigured = (): boolean =>
    Boolean(
        process.env.SMTP_HOST?.trim() &&
            process.env.SMTP_USER?.trim() &&
            process.env.SMTP_PASS?.trim()
    );

export async function sendPasswordResetEmail(
    to: string,
    resetUrl: string
): Promise<{ sent: boolean; reason?: string }> {
    if (!isSmtpConfigured()) {
        if (process.env.NODE_ENV !== "production") {
        }
        return { sent: false, reason: "smtp_not_configured" };
    }

    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const from =
        process.env.SMTP_FROM?.trim() ||
        process.env.SMTP_USER ||
        "noreply@teachteam.app";

    await transporter.sendMail({
        from,
        to,
        subject: "Reset your TeachTeam password",
        text: `You requested a password reset.\n\nOpen this link (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
        html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>`,
    });

    return { sent: true };
}
