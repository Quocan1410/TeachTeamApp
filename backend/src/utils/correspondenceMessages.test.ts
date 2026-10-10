import {
  appendCandidateMessage,
  appendLecturerMessage,
  buildCorrespondenceFromLegacy,
  canCandidateEditMessage,
  clearLecturerCorrespondence,
  correspondenceMessageExists,
  deleteCorrespondenceMessage,
  getCorrespondenceMessages,
  isCorrespondenceMessageDeleted,
  parseCorrespondenceMessages,
  syncLecturerCommentMessage,
  updateCandidateMessage,
} from "./correspondenceMessages";
import type { Application } from "../entities/Application";

function baseApplication(
  overrides: Partial<Application> = {}
): Application {
  return {
    candidateId: "c1",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    appliedAt: new Date("2025-12-01T00:00:00.000Z"),
    correspondenceMessages: [],
    ...overrides,
  } as Application;
}

describe("parseCorrespondenceMessages", () => {
  it("returns an empty list for non-arrays", () => {
    expect(parseCorrespondenceMessages(null)).toEqual([]);
  });

  it("keeps well-formed messages and sorts by createdAt", () => {
    expect(
      parseCorrespondenceMessages([
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
        },
        { id: "", body: "bad" },
      ]).map((message) => message.id)
    ).toEqual(["1", "2"]);
  });
});

describe("legacy and lookup helpers", () => {
  it("builds messages from comment and candidateResponse", () => {
    const application = baseApplication({
      comment: "Lecturer note",
      commentedBy: "l1",
      commentedAt: new Date("2026-01-01T00:00:00.000Z"),
      candidateResponse: "Thanks",
      candidateRespondedAt: new Date("2026-01-02T00:00:00.000Z"),
    });
    const messages = buildCorrespondenceFromLegacy(application);
    expect(messages).toHaveLength(2);
    expect(getCorrespondenceMessages(application)).toHaveLength(2);
    expect(correspondenceMessageExists(application, messages[0].id)).toBe(true);
  });

  it("marks deleted messages", () => {
    expect(
      isCorrespondenceMessageDeleted({
        id: "1",
        authorRole: "candidate",
        authorId: "c1",
        body: "Hi",
        createdAt: "2026-01-01T00:00:00.000Z",
        deletedAt: "2026-01-02T00:00:00.000Z",
      })
    ).toBe(true);
  });
});

describe("append and mutate messages", () => {
  it("appends candidate and lecturer messages", () => {
    const application = baseApplication();
    const candidate = appendCandidateMessage(application, "c1", "Hello");
    expect(candidate.authorRole).toBe("candidate");
    expect(application.candidateResponse).toBe("Hello");

    const lecturer = appendLecturerMessage(application, "l1", "Welcome", candidate.id);
    expect(lecturer.replyToMessageId).toBe(candidate.id);
    expect(application.comment).toBe("Welcome");
    expect(application.reviewedBy).toBe("l1");
  });

  it("syncs the lecturer primary comment and clears it", () => {
    const application = baseApplication();
    syncLecturerCommentMessage(application, "l1", "Primary note");
    expect(application.comment).toBe("Primary note");
    syncLecturerCommentMessage(application, "l1", "Updated note");
    expect(application.comment).toBe("Updated note");
    syncLecturerCommentMessage(application, "l1", "   ");
    expect(application.comment).toBe("");
  });

  it("updates and deletes candidate messages inside the edit window", () => {
    const application = baseApplication();
    const message = appendCandidateMessage(application, "c1", "Draft");
    expect(canCandidateEditMessage(message)).toBe(true);
    expect(updateCandidateMessage(application, "c1", message.id, "Edited")?.body).toBe(
      "Edited"
    );
    expect(deleteCorrespondenceMessage(application, "c1", message.id)).toBe(true);
    expect(deleteCorrespondenceMessage(application, "c1", message.id)).toBe(false);
  });

  it("soft-deletes lecturer correspondence", () => {
    const application = baseApplication();
    appendLecturerMessage(application, "l1", "Offer");
    clearLecturerCorrespondence(application);
    expect(application.comment).toBe("");
  });
});
