import { execSync } from "node:child_process";

// Resets the test database to the current migrations once per run.
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Point it at a disposable MySQL database " +
        "(see README: Running tests).",
    );
  }

  // The reset drops every table, so refuse anything that doesn't look like a
  // test database.
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
