import {
  clearTourCompleted,
  hasCompletedTour,
  markTourCompleted,
  tourStorageKey,
} from "./tourStorage";

describe("tourStorage", () => {
  const tourId = "unit-tour";
  const userId = "user-1";

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keys tours per user", () => {
    expect(tourStorageKey(tourId, userId)).toBe(
      "teachteam-page-tour:unit-tour:user-1"
    );
  });

  it("marks and reads completion", () => {
    expect(hasCompletedTour(tourId, userId)).toBe(false);
    markTourCompleted(tourId, userId);
    expect(hasCompletedTour(tourId, userId)).toBe(true);
    clearTourCompleted(tourId, userId);
    expect(hasCompletedTour(tourId, userId)).toBe(false);
  });
});
