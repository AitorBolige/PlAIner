import { test, expect } from "@playwright/test";

test.describe("unauthenticated smoke", () => {
  test("/ redirects to /auth/login when there is no session", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test("/auth/login renders the credentials form", async ({ page }) => {
    await page.goto("/auth/login");
    // Email + password inputs must be present and interactive.
    const email = page.locator('input[type="email"]').first();
    const password = page.locator('input[type="password"]').first();
    await expect(email).toBeVisible();
    await expect(password).toBeVisible();
  });

  test("/trips/non-existent-id returns 404 for unauthenticated requests", async ({
    request,
  }) => {
    // Middleware redirects unauthenticated requests to /auth/login, so this
    // proves that protected routes are not accidentally exposed.
    const response = await request.get("/trips/does-not-exist", {
      maxRedirects: 0,
    });
    // Either a redirect (middleware) or 404 (route handler) is acceptable; the
    // failing condition would be a 200 with trip data.
    expect([302, 307, 404]).toContain(response.status());
  });
});
