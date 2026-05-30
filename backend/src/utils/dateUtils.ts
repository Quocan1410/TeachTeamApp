/**
 * @deprecated Use appTime.ts — kept for imports that expect legacy names.
 */
import {
    APP_TIMEZONE,
    formatAppDateTime,
    getAppTimestamp,
    getAppTimezoneLabel,
} from "./appTime";

export const getMelbourneTime = (): Date =>
    new Date(new Date().toLocaleString("en-US", { timeZone: APP_TIMEZONE }));

export const getMelbourneISOString = (): string => getAppTimestamp();

export const getMelbourneTimestamp = (): string => getAppTimestamp();

export const formatMelbourneDate = (date?: Date | string): string => {
    const target = date ? new Date(date) : new Date();
    return formatAppDateTime(target);
};

export const getMelbourneDateOnly = (): string => {
    const d = new Date();
    return d.toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
};

export const getMelbourneOffset = (): string => getAppTimezoneLabel();

export const utcToMelbourne = (utcDate: Date): Date => new Date(utcDate);
