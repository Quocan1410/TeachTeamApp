import { UserType } from "@/shared/types/user";
import { TUTOR_TOUR_ID } from "./tutorTour";
import { LECTURER_TOUR_ID } from "./lecturerTour";

export type PageTourCatalogItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  roles: UserType[];
};

export const PAGE_TOUR_CATALOG: PageTourCatalogItem[] = [
  {
    id: TUTOR_TOUR_ID,
    title: "Finding teaching roles",
    description:
      "Search, filters, course cards, applications, and the helper mascot on your roles page.",
    href: "/tutor",
    roles: [UserType.CANDIDATE],
  },
  {
    id: LECTURER_TOUR_ID,
    title: "Reviewing applications",
    description:
      "Filters, the applicant list, and the detail pane on your lecturer dashboard.",
    href: "/lecturer",
    roles: [UserType.LECTURER],
  },
];

export function toursForRole(userType: UserType): PageTourCatalogItem[] {
  return PAGE_TOUR_CATALOG.filter((tour) => tour.roles.includes(userType));
}

export function hasCompletedPageTour(
  completed: string[] | null | undefined,
  tourId: string
): boolean {
  return Array.isArray(completed) && completed.includes(tourId);
}
