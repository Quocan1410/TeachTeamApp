import { formatApiErrorMessage } from "./apiErrors";

describe("formatApiErrorMessage", () => {
  it("prefers the top-level message", () => {
    expect(formatApiErrorMessage({ message: " Boom " }, "fallback")).toBe("Boom");
  });

  it("joins field errors when message is empty", () => {
    expect(
      formatApiErrorMessage(
        { message: " ", errors: { a: "First", b: " Second " } },
        "fallback"
      )
    ).toBe("First Second");
  });

  it("uses the fallback when nothing else is present", () => {
    expect(formatApiErrorMessage({}, "fallback")).toBe("fallback");
  });
});
