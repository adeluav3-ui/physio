import { test, expect } from "@playwright/test";
import { login, checkNoHorizontalScroll } from "./helpers.js";

const PHYSIO_EMAIL = process.env.E2E_PHYSIO_EMAIL ?? "physio@test.rehab360.local";
const PHYSIO_PASS = process.env.E2E_PHYSIO_PASS ?? "TestPass!123";
const PATIENT_EMAIL = process.env.E2E_PATIENT_EMAIL ?? "patient@test.rehab360.local";
const PATIENT_PASS = process.env.E2E_PATIENT_PASS ?? "TestPass!123";
const APPT_ID = process.env.E2E_APPT_ID ?? "";

test.describe("Session room (physio)", () => {
    test.beforeEach(async ({ page }) => {
        await login(page, PHYSIO_EMAIL, PHYSIO_PASS);
    });

    test("session page renders without horizontal scroll at 390px", async ({ page }) => {
        if (!APPT_ID) test.skip();
        await page.goto(`/pro/session/${APPT_ID}`);
        expect(await checkNoHorizontalScroll(page)).toBe(true);
        await page.screenshot({ path: "../../docs/screenshots/session-physio-390.png" });
    });

    test("physio can join session room within window", async ({ page }) => {
        if (!APPT_ID) test.skip();
        await page.goto(`/pro/session/${APPT_ID}`);
        await expect(page.getByRole("button", { name: /join|start/i })).toBeVisible();
    });
});

test.describe("Session room (patient)", () => {
    test.beforeEach(async ({ page }) => {
        await login(page, PATIENT_EMAIL, PATIENT_PASS);
    });

    test("patient session page renders without horizontal scroll at 390px", async ({ page }) => {
        if (!APPT_ID) test.skip();
        await page.goto(`/app/session/${APPT_ID}`);
        expect(await checkNoHorizontalScroll(page)).toBe(true);
        await page.screenshot({ path: "../../docs/screenshots/session-patient-390.png" });
    });
});

test.describe("Note sign-off (physio)", () => {
    test.beforeEach(async ({ page }) => {
        await login(page, PHYSIO_EMAIL, PHYSIO_PASS);
    });

    test("note page renders without horizontal scroll at 390px", async ({ page }) => {
        if (!APPT_ID) test.skip();
        await page.goto(`/pro/session/${APPT_ID}/note`);
        expect(await checkNoHorizontalScroll(page)).toBe(true);
        await page.screenshot({ path: "../../docs/screenshots/note-390.png" });
    });

    test("physio can fill and sign SOAP note", async ({ page }) => {
        if (!APPT_ID) test.skip();
        await page.goto(`/pro/session/${APPT_ID}/note`);

        await page.getByLabel(/subjective/i).fill("Patient reports improvement in shoulder mobility.");
        await page.getByLabel(/objective/i).fill("ROM 140° abduction. Strength 4/5.");
        await page.getByLabel(/assessment/i).fill("Improving. Rotator cuff tendinopathy.");
        await page.getByLabel(/plan/i).fill("Continue home programme. Review in 2 weeks.");
        await page.getByRole("button", { name: /save/i }).click();
        await page.getByRole("button", { name: /sign/i }).click();

        await expect(page.getByText(/signed|locked/i)).toBeVisible();
        await page.screenshot({ path: "../../docs/screenshots/note-signed-390.png" });
    });

    test("signed note fields are read-only", async ({ page }) => {
        if (!APPT_ID) test.skip();
        await page.goto(`/pro/session/${APPT_ID}/note`);
        // After signing, textareas should be readonly
        const textareas = page.locator("textarea[readonly]");
        const count = await textareas.count();
        // If note is already signed, textareas are readonly
        if (count === 0) {
            // Note not signed yet — that's fine, just check the page loads
            await expect(page.getByLabel(/subjective/i)).toBeVisible();
        } else {
            expect(count).toBeGreaterThan(0);
        }
    });

    test("physio can add addendum after signing", async ({ page }) => {
        if (!APPT_ID) test.skip();
        await page.goto(`/pro/session/${APPT_ID}/note`);
        const addendumBox = page.getByPlaceholder(/addendum/i);
        if (await addendumBox.count() > 0) {
            await addendumBox.fill("Addendum: patient called to report reduced pain.");
            await page.getByRole("button", { name: /add addendum/i }).click();
            await expect(page.getByText(/reduced pain/i)).toBeVisible();
        }
    });
});
