export function formatRoleLabel(roleName: string): string {
  return roleName === "tutor" ? "Tutor" : "Lab Assistant";
}

export function formatAppliedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}
