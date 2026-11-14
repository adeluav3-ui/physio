import { test, expect } from "@playwright/test";
import { signup, login, checkNoHorizontalScroll } from "./helpers.js";

const email = `patient+auth${Date.now()}@test.rehab360.local`;
const password = "TestPass!123";

test.describe("Auth — sign up and login", () => {
    test("signup page renders without horizontal scroll at 390px", async ({ page }) => {
        await page.goto("/auth/signup");
        expect(await checkNoHorizontalScroll(page)).toBe(true);
        await page.screenshot({ path: `../../docs/screenshots/signup-390.png` });
    });

    test("patient can sign up", async ({ page }) => {
        await signup(page, "Test Patient", email, password, "PATIENT");
        await expect(page).toHaveURL(/verify|app/i);
    });

    test("duplicate email is rejected", async ({ page }) => {
        await signup(page, "Dup Patient", email, password, "PATIENT");
        await expect(page.getByText(/already/i)).toBeVisible();
    });

    test("wrong password shows error", async ({ page }) => {
        await login(page, email, "wrongpassword");
        await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible();
    });

    test("login page renders without horizontal scroll at 390px", async ({ page }) => {
        await page.goto("/auth/login");
        expect(await checkNoHorizontalScroll(page)).toBe(true);
        await page.screenshot({ path: `../../docs/screenshots/login-390.png` });
    });
});
