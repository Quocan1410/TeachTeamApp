/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  coverageProvider: "v8",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  clearMocks: true,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.module\\.css$": "identity-obj-proxy",
    "\\.css$": "identity-obj-proxy",
  },
  collectCoverageFrom: [
    "src/modules/auth/utils/authValidation.utils.ts",
    "src/shared/utils/personDisplayName.ts",
    "src/shared/utils/applicationStatus.ts",
    "src/shared/utils/avatarUtils.ts",
    "src/shared/utils/cropAvatar.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "json-summary"],
};
