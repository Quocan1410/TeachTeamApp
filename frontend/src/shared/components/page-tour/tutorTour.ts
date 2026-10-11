import type { PageTourStep } from "./PageTour";

export const TUTOR_TOUR_ID = "tutor-dashboard-v1";

export const tutorTourSteps: PageTourStep[] = [
  {
    id: "welcome",
    title: "Welcome to your roles",
    body: "This page is where you find tutor and lab-assistant openings. I’ll point out the useful bits.",
    mascotSrc: "/mascot/mascot-1.png",
  },
  {
    id: "search",
    target: "[data-tour='tutor-search']",
    title: "Search courses",
    body: "Type a course name, code, or role. Search waits a moment after you stop typing.",
    mascotSrc: "/mascot/mascot-1.png",
  },
  {
    id: "filters",
    target: "[data-tour='tutor-filters']",
    title: "Narrow the list",
    body: "Filter by status, role, or course-code order when the list gets long.",
    mascotSrc: "/mascot/mascot-1.png",
  },
  {
    id: "courses",
    target: "[data-tour='tutor-courses']",
    title: "Course cards",
    body: "Each card is an opening. Heart one to apply later, or open Apply when you’re ready.",
    mascotSrc: "/mascot/mascot-1.png",
  },
  {
    id: "applications",
    target: "[data-tour='tutor-applications']",
    title: "Your applications",
    body: "After you apply, track status and chat with the lecturer from here.",
    mascotSrc: "/mascot/mascot-1.png",
  },
  {
    id: "helper",
    target: "[data-tour='tutor-helper']",
    title: "Tap me anytime",
    body: "I’m down here if you want the short notes again. You’re set—go find a role.",
    mascotSrc: "/mascot/mascot-1.png",
  },
];
