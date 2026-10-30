import { test as setup, expect } from "@playwright/test";

/** Seeded local test user. Created on first run; 409 means it already exists. */
export const TEST_USER = { email: "visual-baseline@mortgagemodeler.test", password: "baseline-pass-123" };

const PLATFORM = process.env.NEXT_PUBLIC_PLATFORM_URL ?? "http://localhost:3001";

setup("log in the test user", async ({ page, request }) => {
  const res = await request.post(`${PLATFORM}/auth/register`, { data: TEST_USER });
  expect([201, 409]).toContain(res.status());

  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(TEST_USER.email);
  await page.getByPlaceholder("••••••••").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/");
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
