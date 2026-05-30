/**
 * Application timezone: Vietnam (Asia/Ho_Chi_Minh)
 */
export const APP_TIMEZONE = "Asia/Ho_Chi_Minh";

export const getAppTimestamp = (): string => new Date().toISOString();

export const getAppTimezoneLabel = (): string =>
    "Asia/Ho_Chi_Minh (ICT)";

export const formatAppDateTime = (date: Date = new Date()): string =>
    date.toLocaleString("en-AU", {
        timeZone: APP_TIMEZONE,
        dateStyle: "medium",
        timeStyle: "short",
    });
