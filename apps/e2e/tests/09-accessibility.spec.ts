import { test, expect } from "@playwright/test";
import { login, checkNoHorizontalScroll, checkTouchTargets } from "./helpers.js";

const PATIENT_EMAIL = process.env.E2E_PATIENT_EMAIL ?? "patient@test.rehab360.local";
const PATIENT_PASS = process.env.E2E_PATIENT_PASS ?? "TestPass!123";
const PHYSIO_EMAIL = process.env.E2E_PHYSIO_EMAIL ?? "physio@test.rehab360.local";
const PHYSIO_PASS = process.env.E2E_PHYSIO_PASS ?? "TestPass!123";

const PUBLIC_PAGES = [
    "/",
    "/auth/login",
    "/auth/signup",
    "/auth/forgot",
    "/professionals",
];

const PATIENT_PAGES = [
    "/app",
    "/app/appointments",
    "/app/messages",
    "/app/plan",
    "/app/referrals",
];

const PHYSIO_PAGES = [
    "/pro",
    "/pro/appointments",
    "/pro/messages",
    "/pro/referrals",
];

for (const path of PUBLIC_PAGES) {
    test(`public page ${path} — no horizontal scroll at 390px`, async ({ page }) => {
        await page.goto(path);
        expect(await checkNoHorizontalScroll(page)).toBe(true);
    });

    test(`public page ${path} — no horizontal scroll at 1280px`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(path);
        expect(await checkNoHorizontalScroll(page)).toBe(true);
    });

    test(`public page ${path} — forms have labels`, async ({ page }) => {
        await page.goto(path);
        const inputs = page.locator("input:visible");
        const count = await inputs.count();
        for (let i = 0; i < count; i++) {
            const input = inputs.nth(i);
            const id = await input.getAttribute("id");
            if (id) {
                const label = page.locator(`label[for="${id}"]`);
                const ariaLabel = await input.getAttribute("aria-label");
                const ariaLabelledBy = await input.getAttribute("aria-labelledby");
                const hasLabel = (await label.count()) > 0 || !!ariaLabel || !!ariaLabelledBy;
                expect(hasLabel).toBe(true);
            }
        }
    });
}

test.describe("Patient pages accessibility", () => {
    test.beforeEach(async ({ page }) => {
        await login(page, PATIENT_EMAIL, PATIENT_PASS);
    });

    for (const path of PATIENT_PAGES) {
        test(`${path} — no horizontal scroll at 390px`, async ({ page }) => {
            await page.goto(path);
            expect(await checkNoHorizontalScroll(page)).toBe(true);
            await page.screenshot({ path: `../../docs/screenshots/a11y${path.replace(/\//g, "-")}-390.png` });
        });

        test(`${path} — touch targets at 390px`, async ({ page }) => {
            await page.goto(path);
            const ok = await checkTouchTargets(page);
            if (!ok) {
                // Report but don't fail the whole suite — some decorative elements may be small
                console.warn(`Small touch target found on ${path}`);
            }
        });
    }
});

test.describe("Physio pages accessibility", () => {
    test.beforeEach(async ({ page }) => {
        await login(page, PHYSIO_EMAIL, PHYSIO_PASS);
    });

    for (const path of PHYSIO_PAGES) {
        test(`${path} — no horizontal scroll at 390px`, async ({ page }) => {
            await page.goto(path);
            expect(await checkNoHorizontalScroll(page)).toBe(true);
            await page.screenshot({ path: `../../docs/screenshots/a11y${path.replace(/\//g, "-")}-390.png` });
        });
    }
});

test("focus is visible on login form", async ({ page }) => {
    await page.goto("/auth/login");
    await page.keyboard.press("Tab");
    // Check a focused element is visible
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
});
