/**
 * Application timezone: Vietnam (Asia/Ho_Chi_Minh)
 */
import { VN_TIMEZONE, VN_LOCALE } from "./vietnamTime";

const APP_TIMEZONE = VN_TIMEZONE;

export const getAppTime = (): Date =>
  new Date(new Date().toLocaleString("en-US", { timeZone: APP_TIMEZONE }));

/** @deprecated Use getAppTime */
export const getMelbourneTime = getAppTime;

export const getAppISOString = (): string => new Date().toISOString();

/** @deprecated Use getAppISOString */
export const getMelbourneISOString = getAppISOString;

export const getAppDateOnly = (): string => {
  const d = new Date();
  return d.toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
};

/** @deprecated Use getAppDateOnly */
export const getMelbourneDateOnly = getAppDateOnly;

export const getAppYear = (): number => {
  const y = new Date().toLocaleDateString("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
  });
  return parseInt(y, 10);
};

/** @deprecated Use getAppYear */
export const getMelbourneYear = getAppYear;

export const formatAppDate = (
  date?: Date | string,
  format: "full" | "date" | "time" | "datetime" = "full"
): string => {
  const target = date ? new Date(date) : new Date();
  const options: Intl.DateTimeFormatOptions = { timeZone: APP_TIMEZONE };

  switch (format) {
    case "date":
      return target.toLocaleDateString(VN_LOCALE, {
        ...options,
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    case "time":
      return target.toLocaleTimeString(VN_LOCALE, {
        ...options,
        hour: "numeric",
        minute: "2-digit",
      });
    case "datetime":
      return target.toLocaleString(VN_LOCALE, {
        ...options,
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      });
    default:
      return target.toLocaleString(VN_LOCALE, {
        ...options,
        dateStyle: "medium",
        timeStyle: "short",
      });
  }
};

/** @deprecated Use formatAppDate */
export const formatMelbourneDate = formatAppDate;
