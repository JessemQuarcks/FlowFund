// Runs once when the server starts. Importing lib/env validates the
// environment, so a misconfigured deploy fails at boot.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/env");
  }
}
