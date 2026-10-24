import { expect, test, type Page } from "@playwright/test";

const TOKEN = "demo-token";
const demoUser = { id: 7, email: "demo-abc123@demo.example.com", created_at: "2026-10-24T10:00:00Z", is_demo: true };

/** The API is replaced by a stand-in: what is tested here is the visitor's path through the interface. */
async function fakeApi(page: Page, user: object = demoUser) {
  const calls: string[] = [];
  await page.route(/\/(auth|transactions|accounts|debts|budgets|goals|categories|income|recurring-transactions|audit-logs)(\/|$)/, async (route) => {
    const url = new URL(route.request().url());
    calls.push(`${route.request().method()} ${url.pathname}`);
    if (url.pathname === "/auth/demo") {
      return route.fulfill({ json: { access_token: TOKEN, token_type: "bearer" } });
    }
    if (url.pathname === "/auth/me") {
      return route.fulfill({ json: user });
    }
    if (url.pathname.endsWith("/monthly-summary")) {
      return route.fulfill({ json: { month: "2026-10", income_set: true, total_income: "3200.00", total_expenses: "2351.58", net: "848.42", savings_rate: "26.5", transaction_count: 40, previous: { total_income: "3200.00", total_expenses: "2946.98", net: "253.02" }, expenses_by_category: [] } });
    }
    return route.fulfill({ json: [] });
  });
  return calls;
}

test.describe("Try the demo", () => {
  test("one click on the login page signs in without an account and opens the dashboard", async ({ page }) => {
    const calls = await fakeApi(page);
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /try the demo/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    expect(calls).toContain("POST /auth/demo");
    // The token the server gave is the one the session uses from then on.
    expect(await page.evaluate(() => sessionStorage.getItem("access_token"))).toBe(TOKEN);
    await expect(page.getByRole("status")).toContainText(/demo account/i);
    await expect(page.getByRole("link", { name: /create your own free account/i })).toHaveAttribute("href", "/register");
  });

  test("the home page offers the demo too", async ({ page }) => {
    await fakeApi(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /try the demo/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("a demo account cannot change its email or password or be deleted: the settings hide those actions", async ({ page }) => {
    await fakeApi(page);
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /try the demo/i }).click();
    await page.waitForURL(/\/dashboard/);

    await page.goto("/settings");

    await expect(page.getByText(/turned off in the demo account/i)).toBeVisible();
    await expect(page.getByText("Change password")).toHaveCount(0);
    await expect(page.getByText("Danger zone")).toHaveCount(0);
  });

  test("a real account sees no banner and keeps its settings", async ({ page }) => {
    await fakeApi(page, { ...demoUser, email: "me@example.com", is_demo: false });
    await page.goto("/login");
    await page.evaluate(() => sessionStorage.setItem("access_token", "real-token"));
    await page.goto("/settings");

    await expect(page.getByText("Danger zone")).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
  });

  test("when too many demos were started from the network, the visitor is told so and stays on the page", async ({ page }) => {
    await page.route(/\/auth\/demo$/, (route) => route.fulfill({ status: 429, json: { error: "Rate limit exceeded: 30 per 1 hour" } }));
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /try the demo/i }).click();

    await expect(page.getByText(/too many demos were started/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("the demo speaks French when the visitor does", async ({ browser }) => {
    const context = await browser.newContext({ locale: "fr-FR" });
    const page = await context.newPage();
    await fakeApi(page);
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /essayer la démo/i }).click();

    await expect(page.getByRole("status")).toContainText(/compte de démonstration/i);
    await context.close();
  });
});
