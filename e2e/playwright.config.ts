import { defineConfig, devices } from "@playwright/test";

const userApp = process.env.E2E_USER_APP ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    trace: "off",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "user-app",
      testMatch: /guest|candidate|lecturer/,
      use: { ...devices["Desktop Chrome"], baseURL: userApp },
    },
  ],
});
