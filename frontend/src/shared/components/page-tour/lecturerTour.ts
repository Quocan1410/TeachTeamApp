import type { PageTourStep } from "./PageTour";

export const LECTURER_TOUR_ID = "lecturer-dashboard-v1";

export const lecturerTourSteps: PageTourStep[] = [
  {
    id: "welcome",
    title: "Review applications",
    body: "This is your hiring desk. I’ll show how to filter, shortlist, and rank candidates.",
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
