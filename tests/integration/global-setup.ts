import { resetTestDatabase } from "../reset-test-database";

// Resets the test database to the current migrations once per run.
export default function setup() {
  resetTestDatabase();
}
