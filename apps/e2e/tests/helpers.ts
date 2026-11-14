import type { Page } from "@playwright/test";

export const TEST_PATIENT = {
    email: `patient+${Date.now()}@test.rehab360.local`,
    password: "TestPass!123",
    name: "Test Patient",
};

export const TEST_PHYSIO = {
    email: `physio+${Date.now()}@test.rehab360.local`,
    password: "TestPass!123",
    name: "Dr Test Physio",
};

export const TEST_OT = {
    email: `ot+${Date.now()}@test.rehab360.local`,
    password: "TestPass!123",
    name: "Dr Test OT",
};

export async function signup(page: Page, name: string, email: string, password: string, role: "PATIENT" | "PHYSIO") {
    await page.goto("/auth/signup");
    await page.getByLabel(/name/i).fill(name);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    if (role === "PHYSIO") {
        await page.getByRole("radio", { name: /physiotherapist/i }).check();
    }
    await page.getByRole("button", { name: /sign up/i }).click();
}

export async function login(page: Page, email: string, password: string) {
    await page.goto("/auth/login");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
}

export async function checkNoHorizontalScroll(page: Page) {
    const hasScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    return !hasScroll;
}

export async function checkTouchTargets(page: Page) {
    return page.evaluate(() => {
        const interactive = Array.from(document.querySelectorAll("button, a, [role=button]"));
        return interactive.every((el) => {
            const rect = (el as HTMLElement).getBoundingClientRect();
            return rect.width >= 44 || rect.height >= 44;
        });
    });
}
