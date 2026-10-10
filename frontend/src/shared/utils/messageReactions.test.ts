import {
  MESSAGE_REACTION_OPTIONS,
  QUICK_MESSAGE_REACTIONS,
  normalizeMessageReactions,
  userReactedWith,
} from "./messageReactions";

describe("messageReactions", () => {
  it("exposes reaction option lists", () => {
    expect(MESSAGE_REACTION_OPTIONS.length).toBeGreaterThan(0);
    expect(QUICK_MESSAGE_REACTIONS).toEqual(
      expect.arrayContaining(["👏", "👍", "😂"])
    );
  });

  it("normalizes missing reaction maps", () => {
    expect(normalizeMessageReactions(null)).toEqual({});
    expect(normalizeMessageReactions(undefined)).toEqual({});
    expect(normalizeMessageReactions({ m1: { "👍": ["u1"] } })).toEqual({
      m1: { "👍": ["u1"] },
    });
  });

  it("detects whether a user reacted with an emoji", () => {
    const reactions = { m1: { "👍": ["u1"] } };
    expect(userReactedWith(reactions, "m1", "👍", "u1")).toBe(true);
    expect(userReactedWith(reactions, "m1", "👍", "u2")).toBe(false);
    expect(userReactedWith(reactions, "m1", "❤️", "u1")).toBe(false);
    expect(userReactedWith(undefined, "m1", "👍", "u1")).toBe(false);
    expect(userReactedWith(reactions, "m1", "👍", undefined)).toBe(false);
  });
});
