import type { ApplicationResponse } from "@/shared/services/applicationService";

export function getApplicationApplyBlockMessage(
  existing: ApplicationResponse
): string {
  if (existing.isWithdrawn) {
    return "You withdrew this application. You cannot apply again for this role.";
  }
  const roleName = existing.role?.roleName ?? "this role";
  const courseCode = existing.course?.courseCode ?? "this course";
  return `You have already applied for ${roleName} position in ${courseCode}.`;
}
