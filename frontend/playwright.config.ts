import { defineConfig } from "@playwright/test";

/**
 * Visual baseline for the shadcn migration.
 *
 * Needs the full local stack running (`..\dev.ps1`): frontend :3000,
 * platform :3001 (with Postgres) and compute :8000.
 *
 *   npm run test:visual            compare against docs/design/_baseline
 *   npm run test:visual:update     re-record the baseline
 *
 * Uses the locally installed Chrome (channel "chrome") so no browser
 * download is needed.
 */
export default defineConfig({
  testDir: "./e2e",
  snapshotPathTemplate: "docs/design/_baseline/{projectName}/{arg}{ext}",
  timeout: 90_000,
  workers: 3,
  reporter: [["list"]],
  expect: {
    toHaveScreenshot: { maxDiffPixels: 0, animations: "disabled", caret: "hide", scale: "css" },
  },
  use: {
    baseURL: "http://localhost:3000",
    channel: "chrome",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "desktop",
      testMatch: /visual\.spec\.ts/,
      dependencies: ["setup"],
      use: { viewport: { width: 1440, height: 900 }, storageState: "e2e/.auth/user.json" },
    },
    {
      name: "mobile",
      testMatch: /visual\.spec\.ts/,
      dependencies: ["setup"],
      use: { viewport: { width: 390, height: 844 }, storageState: "e2e/.auth/user.json" },
    },
  ],
});
