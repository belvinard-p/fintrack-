import { defineConfig, devices } from "@playwright/test";

// Another project (or an older run of this one) may already be using port 3000: E2E_PORT picks another one, and the
// server below is then started for this run only.
const PORT = Number(process.env.E2E_PORT ?? 3000);

export default defineConfig({
  testDir: "./e2e",
  // `next dev` compiles each page the first time it is opened: on a cold start several tests wait for the same compilation.
  timeout: 60_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
