import { test, expect, type Page } from "@playwright/test";

/**
 * Screenshot every route and its key interactive states.
 * These images are the acceptance criteria for the shadcn migration.
 */

const COMPUTE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Let data load and charts finish animating, then take a full-page shot. */
async function snap(page: Page, name: string, settle = 1800) {
  await page.waitForTimeout(settle);
  await page.mouse.move(0, 0);
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
}

/** Snap without moving the mouse (for hover states). */
async function snapHover(page: Page, name: string) {
  await page.waitForTimeout(500);
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
}

async function go(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
}

/** Compute API never answers → loading state. */
async function holdCompute(page: Page) {
  await page.route(`${COMPUTE}/**`, () => {});
}

/** Compute API fails → error banner. */
async function failCompute(page: Page) {
  await page.route(`${COMPUTE}/**`, (route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: '{"detail":"Internal error"}' }),
  );
}

// ── Auth pages (signed out) ─────────────────────────────

test.describe("auth", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login", async ({ page }) => {
    await go(page, "/login");
    await snap(page, "login");
    await page.getByPlaceholder("you@example.com").focus();
    await snap(page, "login-email-focused", 300);
  });

  test("login error", async ({ page }) => {
    await page.route("**/auth/login", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: '{"message":"Invalid email or password"}' }),
    );
    await go(page, "/login");
    await page.getByPlaceholder("you@example.com").fill("someone@example.com");
    await page.getByPlaceholder("••••••••").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await snap(page, "login-error", 800);
  });

  test("signup", async ({ page }) => {
    await go(page, "/signup");
    await snap(page, "signup");
    await page.locator('input[type="password"]').first().fill("abc12345XY");
    await snap(page, "signup-password-strength", 300);
  });

  test("forgot password", async ({ page }) => {
    await go(page, "/forgot-password");
    await snap(page, "forgot-password");
  });
});

// ── App pages (signed in) ───────────────────────────────

test.describe("home", () => {
  test("dashboard and placeholder tool", async ({ page }) => {
    await go(page, "/");
    await snap(page, "home");
    await go(page, "/offset-impact");
    await snap(page, "tool-placeholder");
  });
});

test.describe("amortisation", () => {
  /** The page starts empty; enter a $600k price with a $100k deposit. */
  async function enterLoan(page: Page) {
    await page.getByRole("textbox", { name: "Purchase price", exact: true }).fill("600000");
    await page.getByRole("textbox", { name: "Deposit", exact: true }).fill("100000");
    await page.getByRole("textbox", { name: "Deposit", exact: true }).blur();
  }

  test("states", async ({ page }) => {
    await go(page, "/amortisation");
    await snap(page, "amortisation-empty");
    await enterLoan(page);
    await snap(page, "amortisation");
    await page.getByRole("radio", { name: "Monthly" }).click();
    await page.getByRole("button", { name: "Equity" }).click();
    await snap(page, "amortisation-monthly-equity");
    await page.getByRole("radio", { name: "Yearly" }).click();
    await snap(page, "amortisation-yearly");
    await page.getByRole("radio", { name: "Table" }).click();
    await snap(page, "amortisation-table");
    await page.locator("main .custom-scrollbar > tr").nth(4).hover();
    await snapHover(page, "amortisation-table-row-hover");
  });

  test("offset saving", async ({ page }) => {
    await go(page, "/amortisation");
    await enterLoan(page);
    await page.getByRole("switch", { name: "Offset account" }).click();
    await page.getByLabel("Balance", { exact: true }).fill("50000");
    await page.getByLabel("Balance", { exact: true }).blur();
    await snap(page, "amortisation-offset");
  });

  test("editing a value", async ({ page }) => {
    await go(page, "/amortisation");
    await page.locator("main input").first().click();
    await snap(page, "amortisation-edit-focused", 400);
  });

  test("loading", async ({ page }) => {
    await holdCompute(page);
    await go(page, "/amortisation");
    await enterLoan(page);
    await snap(page, "amortisation-loading", 1200);
  });

  test("error", async ({ page }) => {
    await failCompute(page);
    await go(page, "/amortisation");
    await enterLoan(page);
    await snap(page, "amortisation-error", 1200);
  });
});

test.describe("tax", () => {
  test("empty, then an investor answering the questions", async ({ page }) => {
    await go(page, "/tax");
    await snap(page, "tax");
    await page.keyboard.type("110000");
    await page.keyboard.press("Enter");
    await page.getByRole("radio", { name: "Yes" }).click();
    await page.getByLabel("Annual rent", { exact: true }).fill("28600");
    await page.getByLabel("Property expenses", { exact: true }).fill("34500");
    await page.getByLabel("Property expenses", { exact: true }).blur();
    for (let i = 0; i < 3; i++) await page.keyboard.press("n");
    await snap(page, "tax-question");
    await page.keyboard.press("y");
    await page.getByLabel("Balance owing", { exact: true }).fill("35000");
    await page.getByLabel("Balance owing", { exact: true }).blur();
    await page.keyboard.press("n");
    await page.keyboard.press("y");
    await page.keyboard.press("n");
    await snap(page, "tax-investor");
  });

  test("salary only, then change a folded answer", async ({ page }) => {
    await go(page, "/tax");
    await page.keyboard.type("110000");
    await page.keyboard.press("Tab");
    for (let i = 0; i < 8; i++) await page.keyboard.press("n");
    await snap(page, "tax-salary-only");
    await page.getByRole("button", { name: /Capital gains/ }).click();
    await page.getByRole("radiogroup", { name: "Capital gains" }).getByRole("radio", { name: "Yes" }).click();
    await page.getByLabel("Held over a year", { exact: true }).fill("30000");
    await page.getByLabel("Held over a year", { exact: true }).blur();
    await snap(page, "tax-capital-gains");
  });

  test("focused input", async ({ page }) => {
    await go(page, "/tax");
    await page.keyboard.type("110000");
    await page.keyboard.press("Enter");
    await page.getByRole("radio", { name: "Yes" }).click();
    await snap(page, "tax-input-focused", 400);
  });

  test("loading", async ({ page }) => {
    await holdCompute(page);
    await go(page, "/tax");
    await page.keyboard.type("90000");
    await snap(page, "tax-loading", 1200);
  });

  test("error", async ({ page }) => {
    await failCompute(page);
    await go(page, "/tax");
    await page.keyboard.type("90000");
    await snap(page, "tax-error");
  });
});

test.describe("grants", () => {
  test("filters and details", async ({ page }) => {
    await go(page, "/grants");
    await snap(page, "grants");
    await page.getByRole("button", { name: "NSW", exact: true }).click();
    await page.getByRole("radio", { name: "Existing", exact: true }).click();
    await page.getByRole("radio", { name: "Couple", exact: true }).click();
    await snap(page, "grants-filtered");
    await page.getByRole("button", { name: "View grant details" }).first().click();
    await snap(page, "grants-details-open", 800);
  });

  test("error", async ({ page }) => {
    await failCompute(page);
    await go(page, "/grants");
    await snap(page, "grants-error");
  });
});

test.describe("purchase costs", () => {
  test("toggles and breakdown", async ({ page }) => {
    await go(page, "/purchase-costs");
    await snap(page, "purchase-costs");
    await page.getByRole("textbox", { name: "Purchase price" }).fill("600000");
    await page.getByRole("textbox", { name: "Deposit" }).fill("60000");
    await page.getByRole("switch", { name: /First home/ }).click();
    await page.getByRole("switch", { name: /couple/i }).click();
    await snap(page, "purchase-costs-toggled");
    await page.getByRole("button", { name: /^Fees/ }).click();
    await snap(page, "purchase-costs-fees-open", 800);
  });

  test("focused input", async ({ page }) => {
    await go(page, "/purchase-costs");
    await page.getByRole("textbox", { name: "Purchase price" }).focus();
    await snap(page, "purchase-costs-input-focused", 400);
  });

  test("error", async ({ page }) => {
    await failCompute(page);
    await go(page, "/purchase-costs");
    // Nothing is calculated until there's a price, so enter one to hit the failing API.
    await page.getByRole("textbox", { name: "Purchase price" }).fill("600000");
    await page.getByRole("textbox", { name: "Purchase price" }).blur();
    await snap(page, "purchase-costs-error", 1200);
  });
});

test.describe("cashflow", () => {
  async function completeWizard(page: Page, shoot: boolean) {
    await go(page, "/cashflow");
    if (shoot) await snap(page, "cashflow-wizard-1-setup");
    await page.getByRole("radio", { name: "Investment" }).click();
    await page.getByRole("radio", { name: "House", exact: true }).click();
    await page.getByRole("radio", { name: "Buying" }).click();
    await page.getByRole("radio", { name: "Yes", exact: true }).click();
    await page.getByLabel("Purchase price").fill("750000");
    await page.getByLabel("Deposit").fill("150000");
    if (shoot) await snap(page, "cashflow-wizard-1-setup-filled");
    for (let step = 2; step <= 6; step++) {
      await page.getByRole("button", { name: "Continue" }).click();
      if (step === 2) {
        if (shoot) await snap(page, "cashflow-wizard-2-empty", 800);
        await page.getByRole("textbox", { name: "Interest rate" }).fill("6.5");
        await page.getByRole("textbox", { name: "Loan term" }).fill("30");
      }
      if (shoot) await snap(page, `cashflow-wizard-${step}`, 800);
    }
    await page.getByRole("button", { name: "Calculate" }).click();
    await page.waitForLoadState("networkidle");
  }

  test("wizard steps", async ({ page }) => {
    await completeWizard(page, true);
    await snap(page, "cashflow-dashboard");
  });

  test("dashboard tabs", async ({ page }) => {
    await completeWizard(page, false);
    for (const tab of ["property", "tax", "equity", "deductions", "costs"]) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      await snap(page, `cashflow-tab-${tab}`, 1200);
    }
  });

  test("details table, drawer and rows", async ({ page }) => {
    await completeWizard(page, false);
    await page.getByRole("radio", { name: "Details", exact: true }).click();
    await snap(page, "cashflow-details");
    const rows = page.locator("table tbody tr");
    await rows.nth(3).hover();
    await snapHover(page, "cashflow-details-row-hover");
    await rows.nth(5).click();
    await snap(page, "cashflow-details-row-selected", 600);
    await page.getByRole("button", { name: /Edit columns/ }).click();
    await snap(page, "cashflow-column-drawer", 800);
  });

  test("edit modal", async ({ page }) => {
    await completeWizard(page, false);
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await snap(page, "cashflow-edit-modal", 800);
  });
});
