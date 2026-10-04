import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

// The app under test talks to the test database. Google, Cloudinary and
// Paystack get placeholders: the flows covered here never call them.
const serverEnv = {
  DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
  NEXTAUTH_URL: baseURL,
  NEXTAUTH_SECRET: "e2e-secret",
  GOOGLE_CLIENT_ID: "e2e",
  GOOGLE_CLIENT_SECRET: "e2e",
  CLOUDINARY_CLOUD_NAME: "e2e",
  CLOUDINARY_API_KEY: "e2e",
  CLOUDINARY_API_SECRET: "e2e",
  PAYSTACK_SECRET_KEY: process.env.E2E_PAYSTACK_SECRET_KEY ?? "sk_test_e2e",
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY:
    process.env.E2E_PAYSTACK_PUBLIC_KEY ?? "pk_test_e2e",
};

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Test the production build: it is what ships, and the dev server
    // compiles routes on demand, which makes timings flaky.
    command: `npx next build && npx next start -p ${PORT}`,
    url: baseURL,
    env: serverEnv,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
