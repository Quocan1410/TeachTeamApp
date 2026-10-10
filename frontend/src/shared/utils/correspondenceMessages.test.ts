import {
  CANDIDATE_EDIT_WINDOW_MS,
  canEditCandidateMessage,
  getCorrespondenceMessages,
  isCorrespondenceMessageDeleted,
  parseCorrespondenceMessages,
} from "./correspondenceMessages";
import type { ApplicationResponse } from "@/shared/services/applicationService";

describe("correspondenceMessages", () => {
  it("parses and sorts valid messages", () => {
    expect(parseCorrespondenceMessages(null)).toEqual([]);
    expect(parseCorrespondenceMessages("nope")).toEqual([]);
    const parsed = parseCorrespondenceMessages([
      {
        id: "2",
        authorRole: "lecturer",
        authorId: "l1",
        body: "Later",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "1",
        authorRole: "candidate",
        authorId: "c1",
        body: "First",
        createdAt: "2026-01-01T00:00:00.000Z",
        replyToMessageId: "  ",
      },
      { id: "", authorRole: "candidate", authorId: "c1", body: "x", createdAt: "x" },
    ]);
    expect(parsed.map((m) => m.id)).toEqual(["1", "2"]);
    expect(parsed[0].replyToMessageId).toBeNull();
  });

  it("falls back to legacy comment fields", () => {
    const application = {
      appliedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      comment: "Please revise",
      commentedBy: "l1",
      commentedAt: "2026-01-02T00:00:00.000Z",
      candidateResponse: "Done",
      candidateRespondedAt: "2026-01-03T00:00:00.000Z",
      candidateId: "c1",
      candidate: { id: "c1" },
    } as unknown as ApplicationResponse;

    const messages = getCorrespondenceMessages(application);
    expect(messages).toHaveLength(2);
    expect(messages[0].authorRole).toBe("lecturer");
    expect(messages[1].authorRole).toBe("candidate");
  });

  it("prefers stored messages and filters pre-apply noise", () => {
    const application = {
      appliedAt: "2026-01-02T00:00:00.000Z",
      correspondenceMessages: [
        {
          id: "old",
          authorRole: "candidate",
          authorId: "c1",
          body: "Before apply",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "new",
          authorRole: "lecturer",
          authorId: "l1",
          body: "After",
          createdAt: "2026-01-03T00:00:00.000Z",
        },
      ],
    } as unknown as ApplicationResponse;

    expect(getCorrespondenceMessages(application).map((m) => m.id)).toEqual([
      "new",
    ]);
  });

  it("detects deleted messages and edit window", () => {
    expect(
      isCorrespondenceMessageDeleted({
        id: "1",
        authorRole: "candidate",
        authorId: "c1",
        body: "x",
        createdAt: new Date().toISOString(),
        deletedAt: "2026-01-01T00:00:00.000Z",
      })
    ).toBe(true);

    expect(
      canEditCandidateMessage({
        id: "1",
        authorRole: "candidate",
        authorId: "c1",
        body: "x",
        createdAt: new Date().toISOString(),
      })
    ).toBe(true);

    expect(
      canEditCandidateMessage({
        id: "1",
        authorRole: "lecturer",
        authorId: "l1",
        body: "x",
        createdAt: new Date().toISOString(),
      })
    ).toBe(false);

    expect(
      canEditCandidateMessage({
        id: "1",
        authorRole: "candidate",
        authorId: "c1",
        body: "x",
        createdAt: new Date(
          Date.now() - CANDIDATE_EDIT_WINDOW_MS - 1000
        ).toISOString(),
      })
    ).toBe(false);
  });
});
