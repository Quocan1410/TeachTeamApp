import { resolveNotificationNav } from "./notificationNav";

describe("resolveNotificationNav", () => {
  it("deep-links lecturers to the application chat for candidate replies", () => {
    expect(
      resolveNotificationNav({
        type: "application_response",
        link: "/lecturer",
        applicationId: "app-1",
        userType: "lecturer",
      })
    ).toEqual({
      href: "/lecturer?applicationId=app-1",
      actionLabel: "Open chat",
      hint: "Opens this application so you can read the candidate’s reply.",
    });
  });

  it("does not open lecturer links for candidates", () => {
    expect(
      resolveNotificationNav({
        type: "application_response",
        link: "/lecturer",
        applicationId: "app-1",
        userType: "candidate",
      })
    ).toEqual({
      href: "/tutor/applications?applicationId=app-1",
      actionLabel: "View application",
      hint: "Opens your applications list.",
    });
  });

  it("returns null when the user cannot open the destination", () => {
    expect(
      resolveNotificationNav({
        type: "user_registered",
        link: "/dashboard",
        userType: "lecturer",
      })
    ).toBeNull();
  });
});
