import { test, expect } from "@playwright/test";

const baseURL = "http://localhost:3000";
const publicRoutes = ["/", "/whitepapers/practical-guide-to-private-ai", "/contact", "/privacy", "/terms", "/accessibility", "/editorial-policy", "/disclaimer", "/cookies", "/legal/terms", "/download/verify"];
const adminRoutes = ["/admin", "/admin/content", "/admin/content/new", "/admin/sources", "/admin/sites", "/admin/sites/manage", "/admin/sites/readiness", "/admin/themes", "/admin/integrations", "/admin/leads", "/admin/users"];

async function auditRoutes(page: import("@playwright/test").Page, routes: string[], label: string) {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") failures.push(`${label} console: ${message.text()}`); });
  for (const route of routes) {
    const response = await page.goto(`${baseURL}${route}`, { waitUntil: "load", timeout: 60000 });
    expect(response?.status(), `${label} ${route}`).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("h1").first(), `${label} ${route} heading`).toBeVisible();
  }
  expect(failures, `${label} browser errors`).toEqual([]);
}

test.describe("prototype UI audit", () => {
  test("public routes render without browser errors", async ({ page }) => {
    await auditRoutes(page, publicRoutes, "public");
  });

  test("public homepage interactions work at desktop and mobile widths", async ({ page }) => {
    await page.goto(baseURL);
    await expect(page.locator(".featured-carousel")).toBeVisible();
    await page.getByRole("button", { name: "Next featured items" }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByText("Menu", { exact: true }).click();
    await expect(page.getByRole("link", { name: "Explore" })).toBeVisible();
    await page.screenshot({ path: "test-results/public-home-mobile.png", fullPage: true });
  });

  test("admin routes render after local login", async ({ page }) => {
    await page.goto(`${baseURL}/admin/login`);
    await page.getByLabel("Username").fill("admin");
    await page.getByLabel("Password").fill(process.env.UI_AUDIT_ADMIN_PASSWORD ?? "local-prototype-password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin(?:\?|$)/);
    await auditRoutes(page, adminRoutes, "admin");
  });
});
