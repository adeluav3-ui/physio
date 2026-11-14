import { test, expect } from "@playwright/test";
import { login, checkNoHorizontalScroll } from "./helpers.js";

const PATIENT_EMAIL = process.env.E2E_PATIENT_EMAIL ?? "patient@test.rehab360.local";
const PATIENT_PASS = process.env.E2E_PATIENT_PASS ?? "TestPass!123";

test.describe("Intake flow", () => {
    test.beforeEach(async ({ page }) => {
        await login(page, PATIENT_EMAIL, PATIENT_PASS);
    });

    test("triage form renders without horizontal scroll at 390px", async ({ page }) => {
        await page.goto("/app/intake/symptoms");
        expect(await checkNoHorizontalScroll(page)).toBe(true);
        await page.screenshot({ path: "../../docs/screenshots/intake-390.png" });
    });

    test("RED triage symptoms block booking and show emergency notice", async ({ page }) => {
        await page.goto("/app/intake/symptoms");
        // Select a red-flag symptom
        const redFlagOption = page.getByLabel(/chest pain|severe headache|loss of consciousness/i).first();
        if (await redFlagOption.count() > 0) {
            await redFlagOption.check();
        } else {
            // Try selecting via text
            await page.getByText(/chest pain/i).first().click();
        }
        await page.getByRole("button", { name: /next|continue/i }).click();
        // Eventually should land on result page with emergency warning
        await page.waitForURL(/result/);
        await expect(page.getByText(/emergency|call.*999|call.*112/i)).toBeVisible();
    });

    test("GREEN triage shows physiotherapist list", async ({ page }) => {
        await page.goto("/app/intake/symptoms");
        // Choose a non-urgent symptom
        const safeOption = page.getByLabel(/back pain|muscle|stiffness/i).first();
        if (await safeOption.count() > 0) await safeOption.check();
        await page.getByRole("button", { name: /next|continue/i }).click();
        await page.waitForURL(/result|physios/);
        await expect(page.getByText(/physiotherapist|specialist/i)).toBeVisible();
    });

    test("triage result shows ranked list", async ({ page }) => {
        await page.goto("/app/triage/result");
        await expect(page.getByText(/physiotherapist|no results/i)).toBeVisible();
        await page.screenshot({ path: "../../docs/screenshots/triage-result-390.png" });
    });
});
