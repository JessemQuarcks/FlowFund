import { execSync } from "node:child_process";

// Drops every table in the test database and reapplies the migrations.
// Shared by the integration tests and the end-to-end tests.
export function resetTestDatabase() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Point it at a disposable MySQL database " +
        "(see README: Running tests).",
    );
  }

  // Refuse anything that doesn't look like a test database.
  const name = new URL(url).pathname.slice(1);
  if (!/test/i.test(name)) {
    throw new Error(
      `Refusing to reset database "${name}": the test database name must contain "test".`,
    );
  }

  execSync("npx prisma migrate reset --force --skip-seed --skip-generate", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
