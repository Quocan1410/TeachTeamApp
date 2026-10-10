import {
  CORRESPONDENCE_INACTIVE_MESSAGE,
  WITHDRAWN_APPLICATION_MESSAGE,
  respondIfCandidateBlocked,
  respondIfCorrespondenceInactive,
  respondIfWithdrawn,
} from "./applicationGuards";
import type { Application } from "../entities/Application";
import { CORRESPONDENCE_INACTIVITY_MS } from "./correspondencePolicy";

function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

describe("applicationGuards", () => {
  it("responds for withdrawn applications", () => {
    const res = mockRes();
    expect(
      respondIfWithdrawn({ isWithdrawn: true } as Application, res as never)
    ).toBe(true);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: WITHDRAWN_APPLICATION_MESSAGE })
    );
    expect(respondIfWithdrawn({ isWithdrawn: false } as Application, res as never)).toBe(
      false
    );
  });

  it("responds for blocked candidates", () => {
    const res = mockRes();
    expect(
      respondIfCandidateBlocked(
        { candidate: { isBlocked: true } } as Application,
        res as never
      )
    ).toBe(true);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "CANDIDATE_BLOCKED" })
    );
  });

  it("responds when correspondence is inactive", () => {
    const res = mockRes();
    expect(
      respondIfCorrespondenceInactive(
        {
          appliedAt: new Date(Date.now() - CORRESPONDENCE_INACTIVITY_MS - 1),
        } as Application,
        res as never
      )
    ).toBe(true);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: CORRESPONDENCE_INACTIVE_MESSAGE })
    );
  });
});
