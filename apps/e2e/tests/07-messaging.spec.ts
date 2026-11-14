import { test, expect } from "@playwright/test";
import { login, checkNoHorizontalScroll } from "./helpers.js";

const PHYSIO_EMAIL = process.env.E2E_PHYSIO_EMAIL ?? "physio@test.rehab360.local";
const PHYSIO_PASS = process.env.E2E_PHYSIO_PASS ?? "TestPass!123";
const PATIENT_EMAIL = process.env.E2E_PATIENT_EMAIL ?? "patient@test.rehab360.local";
const PATIENT_PASS = process.env.E2E_PATIENT_PASS ?? "TestPass!123";

test.describe("Messaging", () => {
    test("patient messages list renders without horizontal scroll at 390px", async ({ page }) => {
        await login(page, PATIENT_EMAIL, PATIENT_PASS);
        await page.goto("/app/messages");
        expect(await checkNoHorizontalScroll(page)).toBe(true);
        await page.screenshot({ path: "../../docs/screenshots/messages-patient-390.png" });
    });

    test("pro messages list renders without horizontal scroll at 390px", async ({ page }) => {
        await login(page, PHYSIO_EMAIL, PHYSIO_PASS);
        await page.goto("/pro/messages");
        expect(await checkNoHorizontalScroll(page)).toBe(true);
        await page.screenshot({ path: "../../docs/screenshots/messages-pro-390.png" });
    });

    test("patient messages list renders without horizontal scroll at 1280px", async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await login(page, PATIENT_EMAIL, PATIENT_PASS);
        await page.goto("/app/messages");
        expect(await checkNoHorizontalScroll(page)).toBe(true);
        await page.screenshot({ path: "../../docs/screenshots/messages-patient-1280.png" });
    });

    test("patient can open a thread", async ({ page }) => {
        await login(page, PATIENT_EMAIL, PATIENT_PASS);
        await page.goto("/app/messages");
        const link = page.getByRole("link").first();
        if (await link.count() === 0) test.skip();
        await link.click();
        await page.waitForURL(/\/app\/messages\/.+/);
        expect(await checkNoHorizontalScroll(page)).toBe(true);
        await page.screenshot({ path: "../../docs/screenshots/thread-patient-390.png" });
    });

    test("patient can send a message", async ({ page }) => {
        await login(page, PATIENT_EMAIL, PATIENT_PASS);
        await page.goto("/app/messages");
        const link = page.getByRole("link").first();
        if (await link.count() === 0) test.skip();
        await link.click();
        await page.waitForURL(/\/app\/messages\/.+/);
        const textarea = page.locator("textarea");
        await textarea.fill("Hello, I have a question about my exercise plan.");
        await page.getByRole("button", { name: /send/i }).click();
        await expect(page.getByText(/question about my exercise/i)).toBeVisible();
    });

    test("patient sending red-flag message sees emergency notice", async ({ page }) => {
        await login(page, PATIENT_EMAIL, PATIENT_PASS);
        await page.goto("/app/messages");
        const link = page.getByRole("link").first();
        if (await link.count() === 0) test.skip();
        await link.click();
        await page.waitForURL(/\/app\/messages\/.+/);
        const textarea = page.locator("textarea");
        await textarea.fill("I have chest pain and difficulty breathing.");
        await page.getByRole("button", { name: /send/i }).click();
        await expect(page.getByText(/emergency|call.*112|call.*199/i)).toBeVisible();
        await page.screenshot({ path: "../../docs/screenshots/red-flag-notice-390.png" });
    });
});
