/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  coverageProvider: "v8",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  clearMocks: true,
  collectCoverageFrom: [
    "src/utils/validation.ts",
    "src/utils/passwordRules.ts",
    "src/utils/pagination.ts",
    "src/utils/courseDeadline.ts",
    "src/utils/avatarUtils.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "json-summary"],
};
