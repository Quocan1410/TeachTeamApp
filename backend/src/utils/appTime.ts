/** Vietnam has no daylight saving. Store instants as UTC; display with Asia/Ho_Chi_Minh. */
export const APP_TIMEZONE = "Asia/Ho_Chi_Minh";

export const getAppTimestamp = (): string => new Date().toISOString();

export const getAppTimezoneLabel = (): string => "Asia/Ho_Chi_Minh (ICT)";
