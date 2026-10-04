import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = dirname(fileURLToPath(import.meta.url));

// Placeholder values so modules that import lib/env load in tests. No test
// talks to Google, Cloudinary or Paystack: those calls are mocked.
const testEnv = {
  NODE_ENV: "test",
  DATABASE_URL: "mysql://test:test@localhost:3306/unused",
  NEXTAUTH_URL: "http://localhost:3000",
  NEXTAUTH_SECRET: "test-secret",
  GOOGLE_CLIENT_ID: "test",
  GOOGLE_CLIENT_SECRET: "test",
  CLOUDINARY_CLOUD_NAME: "test",
  CLOUDINARY_API_KEY: "test",
  CLOUDINARY_API_SECRET: "test",
  PAYSTACK_SECRET_KEY: "sk_test_placeholder",
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: "pk_test_placeholder",
};

export default defineConfig({
  resolve: {
    alias: [{ find: /^@\//, replacement: `${root}/` }],
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
          env: testEnv,
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          env: {
            ...testEnv,
            DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
          },
          globalSetup: ["tests/integration/global-setup.ts"],
          // Tests share one database, so run files one at a time in a
          // single worker.
          fileParallelism: false,
          pool: "forks",
          poolOptions: { forks: { singleFork: true } },
          testTimeout: 30_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
