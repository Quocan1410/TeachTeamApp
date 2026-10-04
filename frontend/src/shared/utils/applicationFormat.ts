import { VN_LOCALE, VN_TIMEZONE } from "./vietnamTime";

export function formatRoleLabel(roleName: string): string {
  return roleName === "tutor" ? "Tutor" : "Lab Assistant";
}

export function formatAppliedDate(iso: string): string {
  return new Date(iso).toLocaleDateString(VN_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: VN_TIMEZONE,
  });
}
