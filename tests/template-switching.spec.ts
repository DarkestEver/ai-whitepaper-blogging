import { test, expect, type Page } from "@playwright/test";

const baseURL = "http://localhost:3000";
const ADMIN_USER = "admin";
const ADMIN_PASS = process.env.UI_AUDIT_ADMIN_PASSWORD ?? "MyTestPass2024!";

// Template ID -> unique root CSS selector on homepage
const TEMPLATE_SELECTORS: Record<string, string> = {
  default: ".site-shell",
  newsmag: ".nm",
  magazine: ".mag",
  newsy: ".nsy",
  hotnewsy: ".hn",
  hotmagazine: ".hm",
  classicmagazine: ".cm",
  gamerworld: ".gw",
  pennnews: ".pn",
  lifestyle: ".ls",
};

const TEMPLATE_IDS = Object.keys(TEMPLATE_SELECTORS);

async function adminLogin(page: Page) {
  await page.goto(`${baseURL}/admin/login`);
  await page.getByLabel("Username").fill(ADMIN_USER);
  await page.getByLabel("Password").fill(ADMIN_PASS);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
}

async function getSiteIds(page: Page): Promise<string[]> {
  await page.goto(`${baseURL}/admin/sites`);
  await page.waitForLoadState("networkidle");
  const siteLinks = page.locator('a[href*="/admin/sites/"]');
  const ids: string[] = [];
  const count = await siteLinks.count();
  for (let i = 0; i < count; i++) {
    const href = await siteLinks.nth(i).getAttribute("href");
    if (href) {
      const m = href.match(/\/admin\/sites\/(\d+)$/);
      if (m && !ids.includes(m[1])) ids.push(m[1]);
    }
  }
  if (ids.length === 0) throw new Error("No sites found");
  return ids;
}

async function changeTemplate(page: Page, siteId: string, templateId: string) {
  // Navigate directly to theme tab via query param
  await page.goto(`${baseURL}/admin/sites/${siteId}/settings?tab=theme`);
  await page.waitForLoadState("networkidle");

  // Wait for the template select to appear (client component hydration)
  const select = page.locator('select[name="templateId"]');
  await select.waitFor({ state: "visible", timeout: 10000 });
  await select.selectOption(templateId);

  // Submit the form
  const saveBtn = page.getByRole("button", { name: /save/i });
  await saveBtn.click();

  // Wait for save to complete (redirect or page refresh)
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
}

async function setDevSiteCookie(page: Page, siteId: string) {
  await page.context().addCookies([{
    name: "__dev_site",
    value: siteId,
    domain: "localhost",
    path: "/",
  }]);
}

async function verifyTemplate(page: Page, siteId: string, templateId: string) {
  await setDevSiteCookie(page, siteId);
  await page.goto(baseURL, { waitUntil: "networkidle" });

  const selector = TEMPLATE_SELECTORS[templateId];
  const el = page.locator(selector).first();
  await expect(el).toBeVisible({ timeout: 10000 });
}

test.describe("Template switching and rendering", () => {
  test.describe.configure({ timeout: 180000 });

  let siteId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await adminLogin(page);
    const ids = await getSiteIds(page);
    siteId = ids[0];
    console.log(`Using site ID: ${siteId}`);
    await page.close();
  });

  for (const templateId of TEMPLATE_IDS) {
    test(`switch to "${templateId}" template and verify it renders`, async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await adminLogin(page);

      console.log(`Switching site ${siteId} to template: ${templateId}`);
      await changeTemplate(page, siteId, templateId);

      await verifyTemplate(page, siteId, templateId);

      await page.screenshot({
        path: `test-results/template-${templateId}.png`,
        fullPage: true,
      });
      console.log(`Template "${templateId}" verified and screenshot saved.`);

      await context.close();
    });
  }

  test("template change is per-site (not global)", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await adminLogin(page);

    const ids = await getSiteIds(page);
    if (ids.length < 2) {
      console.log("Only 1 site exists - skipping per-site isolation test");
      await context.close();
      test.skip();
      return;
    }

    const [siteA, siteB] = ids;
    console.log(`Testing isolation between site ${siteA} and site ${siteB}`);

    // Set site A to "newsmag", site B to "gamerworld"
    await changeTemplate(page, siteA, "newsmag");
    await changeTemplate(page, siteB, "gamerworld");

    // Verify site A shows newsmag
    await setDevSiteCookie(page, siteA);
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await expect(page.locator(".nm").first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: "test-results/isolation-siteA-newsmag.png", fullPage: true });

    // Verify site B shows gamerworld
    await setDevSiteCookie(page, siteB);
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await expect(page.locator(".gw").first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: "test-results/isolation-siteB-gamerworld.png", fullPage: true });

    console.log("Per-site template isolation confirmed.");
    await context.close();
  });
});
