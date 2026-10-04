import { expect, test } from "@playwright/test";

const inDays = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

test("an organiser signs up, signs in and launches a fundraiser", async ({
  page,
  request,
}) => {
  const email = `organiser-${Date.now()}@example.com`;
  const password = "Fundraise1!";
  const title = `Beach clean-up ${Date.now()}`;

  await test.step("sign up", async () => {
    await page.goto("/signup", { waitUntil: "networkidle" });
    await page.getByLabel("Full Name").fill("Ama Owusu");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm Password").fill(password);
    await page.locator("#agreeTerms").check();
    await page
      .locator("form")
      .getByRole("button", { name: "Sign Up", exact: true })
      .click();
    await expect(page).toHaveURL(/\/signin\?registered=true/);
  });

  await test.step("sign in", async () => {
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page
      .locator("form")
      .getByRole("button", { name: "Sign In", exact: true })
      .click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });

  await test.step("create an event with the default category", async () => {
    await page.goto("/events/create", { waitUntil: "networkidle" });
    await page.getByLabel("Event Title").fill(title);
    await page.getByLabel("Description").fill("Clearing plastic from Labadi");
    await page.getByLabel("Event Date").fill(`${inDays(14)}T10:00`);
    await page.getByLabel("Target Amount (GH₵)").fill("5000");
    await page.getByLabel("Minimum Donation (GH₵)").fill("10");
    await page.getByLabel("Fundraiser End Date").fill(inDays(30));
    await page.getByRole("button", { name: "Create Event" }).click();

    await expect(page).toHaveURL(/\/events\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText("Make a Donation")).toBeVisible();
  });

  await test.step("visitors see no organiser email or password hash", async () => {
    // The request fixture has no session cookie, like a visitor.
    const html = await (await request.get(page.url())).text();
    expect(html).toContain(title);
    expect(html).not.toMatch(/\$2[aby]\$\d{2}\$/); // bcrypt hash prefix
    expect(html).not.toContain(email);
  });

  await test.step("see it on the dashboard", async () => {
    await page.goto("/dashboard");
    await expect(page.getByText(title)).toBeVisible();
  });
});

// Needs server-initialised Paystack transactions and the webhook from
// roadmap Phase 2 (the hosted popup cannot be driven reliably in CI), and a
// withdrawal API, which main does not have yet.
test.fixme("a donor gives with a Paystack test card and the organiser withdraws", async () => {});
