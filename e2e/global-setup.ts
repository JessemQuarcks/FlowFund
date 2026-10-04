import { resetTestDatabase } from "../tests/reset-test-database";

export default function globalSetup() {
  resetTestDatabase();
}
