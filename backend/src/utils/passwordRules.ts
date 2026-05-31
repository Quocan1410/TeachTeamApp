const EMOJI_REGEX =
    /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\uD800-\uDBFF][\uDC00-\uDFFF]/u;

export function validateNewPassword(password: string): string | null {
    if (!password) {
        return "Password is required";
    }
    if (password.length < 8) {
        return "Password must be at least 8 characters long";
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }
    if (EMOJI_REGEX.test(password)) {
        return "Password cannot contain emojis";
    }
    return null;
}
