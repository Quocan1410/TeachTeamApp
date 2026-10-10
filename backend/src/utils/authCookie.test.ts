jest.mock("../config/jwtConfig", () => ({
  signBackendToken: jest.fn(() => "signed-token"),
}));

import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  clearAuthCookie,
  getAuthTokenFromRequest,
  getRefreshTokenFromRequest,
  setAuthCookie,
  setRefreshCookie,
} from "./authCookie";

describe("authCookie", () => {
  it("sets auth and refresh cookies", () => {
    const res = { cookie: jest.fn(), clearCookie: jest.fn() };
    setAuthCookie(res as never, { userId: "1", email: "a@b.com", userType: "candidate" } as never);
    setRefreshCookie(res as never, "refresh-token");
    expect(res.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      "signed-token",
      expect.objectContaining({ httpOnly: true })
    );
    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_COOKIE_NAME,
      "refresh-token",
      expect.objectContaining({ httpOnly: true })
    );
    clearAuthCookie(res as never);
    expect(res.clearCookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      expect.any(Object)
    );
  });

  it("reads tokens from cookies or bearer headers", () => {
    expect(
      getRefreshTokenFromRequest({
        cookies: { [REFRESH_COOKIE_NAME]: " refresh " },
      } as never)
    ).toBe("refresh");
    expect(getRefreshTokenFromRequest({ cookies: {} } as never)).toBeNull();
    expect(
      getAuthTokenFromRequest({
        cookies: { [AUTH_COOKIE_NAME]: "access" },
        headers: {},
      } as never)
    ).toBe("access");
    expect(
      getAuthTokenFromRequest({
        cookies: {},
        headers: { authorization: "Bearer abc" },
      } as never)
    ).toBe("abc");
    expect(
      getAuthTokenFromRequest({ cookies: {}, headers: {} } as never)
    ).toBeNull();
  });
});
