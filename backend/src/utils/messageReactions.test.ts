import {
  isAllowedReactionEmoji,
  isReactableMessageId,
  normalizeMessageReactions,
  toggleUserReaction,
} from "./messageReactions";
import type { Application } from "../entities/Application";

describe("normalizeMessageReactions", () => {
  it("returns an empty map for invalid input", () => {
    expect(normalizeMessageReactions(null)).toEqual({});
    expect(normalizeMessageReactions([])).toEqual({});
  });

  it("keeps unique user ids per emoji", () => {
    expect(
      normalizeMessageReactions({
        m1: { "👍": ["u1", "u1", "u2"], "nope": "x" },
        bad: null,
      })
    ).toEqual({ m1: { "👍": ["u1", "u2"] } });
  });
});

describe("isAllowedReactionEmoji", () => {
  it("accepts the configured emoji set", () => {
    expect(isAllowedReactionEmoji("👍")).toBe(true);
    expect(isAllowedReactionEmoji("x")).toBe(false);
  });
});

describe("toggleUserReaction", () => {
  it("adds and removes a reaction", () => {
    const added = toggleUserReaction({}, "m1", "👍", "u1");
    expect(added).toEqual({ m1: { "👍": ["u1"] } });
    const removed = toggleUserReaction(added, "m1", "👍", "u1");
    expect(removed).toEqual({});
  });
});

describe("isReactableMessageId", () => {
  it("requires a known correspondence message id", () => {
    const application = {
      appliedAt: new Date("2025-01-01T00:00:00.000Z"),
      correspondenceMessages: [
        {
          id: "m1",
          authorRole: "candidate",
          authorId: "c1",
          body: "Hi",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    } as unknown as Application;
    expect(isReactableMessageId(application, "")).toBe(false);
    expect(isReactableMessageId(application, "m1")).toBe(true);
    expect(isReactableMessageId(application, "missing")).toBe(false);
  });
});
