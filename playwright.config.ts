import { defineConfig, devices } from "@playwright/test";
import { scryptSync } from "node:crypto";

const salt = "0123456789abcdef0123456789abcdef";
const password = "E2e-only-sports-2026!";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 12000 },
  globalSetup: "./e2e/setup.ts",
  use: { baseURL: "http://localhost:3108", trace: "retain-on-failure" },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.CI ? undefined : "chrome",
      },
    },
  ],
  webServer: {
    command: "pnpm start --port 3108",
    url: "http://localhost:3108/admin/login",
    reuseExistingServer: false,
    env: {
      DATABASE_URL:
        process.env.E2E_DATABASE_URL ??
        "postgresql://gosw_test:gosw_test@127.0.0.1:55426/gosw_e2e",
      ADMIN_USERNAME: "teacher-test",
      ADMIN_PASSWORD_HASH: `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`,
      AUTH_SECRET: "e2e-only-isolated-secret-do-not-use-in-production",
      NEXT_PUBLIC_APP_URL: "http://localhost:3108",
    },
  },
});
