/**
 * Pilot launch E2E tests (Step 8)
 * Covers: landing page messaging, specialist-only waitlist, legal pages,
 * consent wiring in signup, admin waitlist filter, and feedback form.
 */

import { test, expect } from "@playwright/test";
import { checkNoHorizontalScroll } from "./helpers.js";

// ── 1. Landing page: pilot chip is visible ─────────────────────────────────
test("landing page shows pilot launch chip", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/pilot launching 1 december 2026/i)).toBeVisible();
    await page.screenshot({ path: "../../docs/screenshots/landing-pilot-chip.png" });
});

// ── 2. Landing page: "Book a session" navigates to /auth/signup ────────────
test("landing page 'Book a session' CTA goes to signup", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /book a session/i }).first().click();
    await expect(page).toHaveURL(/\/auth\/signup/);
});

// ── 3. Landing page: "Join as a specialist" scrolls to #specialists ────────
test("landing page 'Join as a specialist' anchor leads to waitlist section", async ({ page }) => {
    await page.goto("/");
    // The link href is #specialists — just verify it exists
    const link = page.getByRole("link", { name: /join as a specialist/i }).first();
    await expect(link).toHaveAttribute("href", "#specialists");
});

// ── 4. Specialist waitlist: no patient toggle present ─────────────────────
test("waitlist form shows no patient toggle — specialist only", async ({ page }) => {
    await page.goto("/#specialists");
    // Patient toggle ("I need care") must not appear
    await expect(page.getByRole("button", { name: /i need care/i })).toHaveCount(0);
    // Discipline pills should be visible
    await expect(page.getByRole("button", { name: /physiotherapy/i })).toBeVisible();
    await page.screenshot({ path: "../../docs/screenshots/waitlist-specialist-only.png" });
});

// ── 5. Privacy policy page renders ────────────────────────────────────────
test("privacy policy page renders without horizontal scroll", async ({ page }) => {
    await page.goto("/legal/privacy");
    await expect(page.getByRole("heading", { name: /privacy notice/i })).toBeVisible();
    expect(await checkNoHorizontalScroll(page)).toBe(true);
    await page.screenshot({ path: "../../docs/screenshots/legal-privacy.png" });
});

// ── 6. Terms of service page renders ──────────────────────────────────────
test("terms of service page renders", async ({ page }) => {
    await page.goto("/legal/terms");
    await expect(page.getByRole("heading", { name: /terms of service/i })).toBeVisible();
    expect(await checkNoHorizontalScroll(page)).toBe(true);
    await page.screenshot({ path: "../../docs/screenshots/legal-terms.png" });
});

// ── 7. Pilot agreement page renders ───────────────────────────────────────
test("pilot agreement page renders", async ({ page }) => {
    await page.goto("/legal/pilot-agreement");
    await expect(page.getByRole("heading", { name: /founding specialist pilot agreement/i })).toBeVisible();
    await page.screenshot({ path: "../../docs/screenshots/legal-pilot-agreement.png" });
});

// ── 8. Patient signup consent links to terms and privacy ──────────────────
test("signup consent checkbox links to terms and privacy", async ({ page }) => {
    await page.goto("/auth/signup");
    // Patient mode is default
    await expect(page.getByRole("link", { name: /terms of service/i })).toHaveAttribute("href", "/legal/terms");
    await expect(page.getByRole("link", { name: /privacy notice/i })).toHaveAttribute("href", "/legal/privacy");
    // Pilot agreement link should NOT appear in patient mode
    await expect(page.getByRole("link", { name: /pilot agreement/i })).toHaveCount(0);
});

// ── 9. Pro signup consent includes pilot agreement ─────────────────────────
test("specialist signup consent includes pilot agreement link", async ({ page }) => {
    await page.goto("/auth/signup");
    // Switch to pro mode
    await page.getByRole("button", { name: /i provide care/i }).click();
    // Now pilot agreement link should appear
    await expect(page.getByRole("link", { name: /founding specialist pilot agreement/i })).toHaveAttribute("href", "/legal/pilot-agreement");
    await page.screenshot({ path: "../../docs/screenshots/signup-pro-consent.png" });
});

// ── 10. Admin waitlist defaults to hiding patient rows ────────────────────
test("admin waitlist page renders and defaults to specialist-only view", async ({ page }) => {
    // This test requires admin auth — skip if not configured
    test.skip(!process.env.E2E_ADMIN_EMAIL, "Admin credentials not set");

    await page.goto("/auth/login");
    await page.getByLabel(/email/i).fill(process.env.E2E_ADMIN_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /log in|sign in/i }).click();
    await page.waitForURL(/\/admin/);

    await page.goto("/admin/waitlist");
    await expect(page.getByRole("heading", { name: /specialist waitlist/i })).toBeVisible();
    // "Show patient entries" checkbox should be unchecked by default
    const checkbox = page.getByRole("checkbox", { name: /show patient entries/i });
    await expect(checkbox).not.toBeChecked();
    await page.screenshot({ path: "../../docs/screenshots/admin-waitlist-default.png" });
});

// ── 11. Feedback page: patient form renders with pain and function sliders ──
test("patient feedback page renders with pain and function sliders", async ({ page }) => {
    // Use a fake session ID — the page renders client-side before auth check
    await page.goto("/app/session/test-session-id/feedback?role=patient");
    // Pain and function sliders are patient-only
    await expect(page.getByText(/how would you rate your pain today/i)).toBeVisible();
    await expect(page.getByText(/how well can you do your daily activities/i)).toBeVisible();
    // Overall rating stars
    await expect(page.getByText(/overall session rating/i)).toBeVisible();
    // Skip button
    await expect(page.getByRole("button", { name: /skip/i })).toBeVisible();
    expect(await checkNoHorizontalScroll(page)).toBe(true);
    await page.screenshot({ path: "../../docs/screenshots/feedback-patient-form.png" });
});
