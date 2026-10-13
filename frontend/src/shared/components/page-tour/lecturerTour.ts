import type { PageTourStep } from "./PageTour";

export const LECTURER_TOUR_ID = "lecturer-dashboard-v2";

export const lecturerTourSteps: PageTourStep[] = [
  {
    id: "header",
    target: "[data-tour='lecturer-header']",
    title: "Your hiring desk",
    body: "Start here. Next I’ll show filters, the applicant list, and the details pane.",
    mascotSrc: "/mascot/mascot-4.png",
  },
  {
    id: "filters",
    target: "[data-tour='lecturer-filters']",
    title: "Find applicants",
    body: "Search and filter the pool before you dive into anyone’s profile.",
    mascotSrc: "/mascot/mascot-4.png",
  },
  {
    id: "list",
    target: "[data-tour='lecturer-list']",
    title: "Applicant list",
    body: "Pick someone here. Shortlist with Yes, or decline when they’re not a fit.",
    mascotSrc: "/mascot/mascot-4.png",
  },
  {
    id: "details",
    target: "[data-tour='lecturer-details']",
    title: "Details & chat",
    body: "Open the full application, leave decisions, and message the candidate from this pane.",
    mascotSrc: "/mascot/mascot-4.png",
  },
];
