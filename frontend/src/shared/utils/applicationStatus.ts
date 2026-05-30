import statusStyles from "@/shared/styles/applicationStatus.module.css";

export type ApplicationStatus = "pending" | "selected" | "rejected";

export function getApplicationStatusLabel(
  status: ApplicationStatus,
  isWithdrawn?: boolean
): string {
  if (isWithdrawn) return "Withdrawn";
  if (status === "selected") return "Selected";
  if (status === "rejected") return "Not selected";
  return "Pending";
}

export function getApplicationStatusClassName(
  status: ApplicationStatus,
  isWithdrawn?: boolean
): string {
  const base = statusStyles.statusBadge;
  if (isWithdrawn) {
    return `${base} ${statusStyles["status-withdrawn"]}`;
  }
  const variant =
    statusStyles[`status-${status}` as keyof typeof statusStyles] ??
    statusStyles["status-pending"];
  return `${base} ${variant}`;
}
