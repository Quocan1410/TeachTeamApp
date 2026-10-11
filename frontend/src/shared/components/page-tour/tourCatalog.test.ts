import { UserType } from "@/shared/types/user";
import {
  hasCompletedPageTour,
  toursForRole,
} from "./tourCatalog";
import { TUTOR_TOUR_ID } from "./tutorTour";
import { LECTURER_TOUR_ID } from "./lecturerTour";

describe("tourCatalog", () => {
  it("filters tours by role", () => {
    expect(toursForRole(UserType.CANDIDATE).map((t) => t.id)).toEqual([
      TUTOR_TOUR_ID,
    ]);
    expect(toursForRole(UserType.LECTURER).map((t) => t.id)).toEqual([
      LECTURER_TOUR_ID,
    ]);
  });

  it("reads completed tours from the account list", () => {
    expect(hasCompletedPageTour(null, TUTOR_TOUR_ID)).toBe(false);
    expect(hasCompletedPageTour([TUTOR_TOUR_ID], TUTOR_TOUR_ID)).toBe(true);
    expect(hasCompletedPageTour([LECTURER_TOUR_ID], TUTOR_TOUR_ID)).toBe(false);
  });
});
