import { test, expect } from "@playwright/test";
import { login, checkNoHorizontalScroll } from "./helpers.js";

const PATIENT_EMAIL = process.env.E2E_PATIENT_EMAIL ?? "patient@test.rehab360.local";
const PATIENT_PASS = process.env.E2E_PATIENT_PASS ?? "TestPass!123";
const APPT_ID = process.env.E2E_APPT_ID ?? "";

test.describe("Post-appointment review", () => {
    test.beforeEach(async ({ page }) => {
        await login(page, PATIENT_EMAIL, PATIENT_PASS);
    });

    test("review page renders without horizontal scroll at 390px", async ({ page }) => {
        if (!APPT_ID) test.skip();
        await page.goto(`/app/appointments/${APPT_ID}/review`);
        expect(await checkNoHorizontalScroll(page)).toBe(true);
        await page.screenshot({ path: "../../docs/screenshots/review-390.png" });
    });

    test("submit button disabled until star is selected", async ({ page }) => {
        if (!APPT_ID) test.skip();
        await page.goto(`/app/appointments/${APPT_ID}/review`);
        const submitBtn = page.getByRole("button", { name: /submit|update/i });
        await expect(submitBtn).toBeDisabled();
    });

    test("patient can submit a 5-star review", async ({ page }) => {
        if (!APPT_ID) test.skip();
        await page.goto(`/app/appointments/${APPT_ID}/review`);
        // Click the 5th star
        const stars = page.getByRole("button").filter({ hasText: "★" });
        await stars.nth(4).click();
        await page.getByRole("button", { name: /submit|update/i }).click();
        await expect(page.getByText(/thank you|submitted/i)).toBeVisible();
        await page.screenshot({ path: "../../docs/screenshots/review-done-390.png" });
    });

    test("review page renders without horizontal scroll at 1280px", async ({ page }) => {
        if (!APPT_ID) test.skip();
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(`/app/appointments/${APPT_ID}/review`);
        expect(await checkNoHorizontalScroll(page)).toBe(true);
        await page.screenshot({ path: "../../docs/screenshots/review-1280.png" });
    });

    test("appointments list renders without horizontal scroll at 390px", async ({ page }) => {
        await page.goto("/app/appointments");
        expect(await checkNoHorizontalScroll(page)).toBe(true);
        await page.screenshot({ path: "../../docs/screenshots/appointments-patient-390.png" });
    });
});
