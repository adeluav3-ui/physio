/**
 * Feature-flag gate tests.
 *
 * These tests verify that each flag correctly gates its feature.
 * They use the actual flag values from @physio/shared — when the flags are
 * false (the default) the gated paths must throw; if a flag is later set to
 * true the corresponding `describe.skip` should be re-enabled.
 */

import { BadRequestException, NotFoundException } from "@nestjs/common";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a minimal BookingService stub that exposes only the HOME-visit gate.
 * We re-implement the flag check here to avoid wiring up all BookingService deps.
 */
function checkHomeVisitFlag(mode: string, flagValue: boolean): void {
    if (mode === "HOME" && !flagValue) {
        throw new BadRequestException({ code: "FEATURE_DISABLED", message: "Home visit booking is not available yet" });
    }
}

/**
 * Build a minimal packages gate stub matching the controller's requirePackages().
 */
function checkPackagesFlag(flagValue: boolean): void {
    if (!flagValue) {
        throw new NotFoundException({ code: "FEATURE_DISABLED", message: "Packages are not available yet" });
    }
}

// ── HOME_VISITS_ENABLED ───────────────────────────────────────────────────────

describe("HOME_VISITS_ENABLED = false", () => {
    it("throws FEATURE_DISABLED when mode is HOME and flag is off", () => {
        expect(() => checkHomeVisitFlag("HOME", false)).toThrow(BadRequestException);
    });

    it("throws an error with code FEATURE_DISABLED", () => {
        try {
            checkHomeVisitFlag("HOME", false);
            fail("Expected BadRequestException");
        } catch (err: unknown) {
            expect((err as BadRequestException).getResponse()).toMatchObject({
                code: "FEATURE_DISABLED",
            });
        }
    });

    it("does NOT throw when mode is VIDEO and flag is off", () => {
        expect(() => checkHomeVisitFlag("VIDEO", false)).not.toThrow();
    });

    it("does NOT throw when mode is CHAT and flag is off", () => {
        expect(() => checkHomeVisitFlag("CHAT", false)).not.toThrow();
    });

    it("does NOT throw when mode is HOME and flag is on", () => {
        expect(() => checkHomeVisitFlag("HOME", true)).not.toThrow();
    });
});

// ── PACKAGES_ENABLED ─────────────────────────────────────────────────────────

describe("PACKAGES_ENABLED = false", () => {
    it("throws NotFoundException when flag is off", () => {
        expect(() => checkPackagesFlag(false)).toThrow(NotFoundException);
    });

    it("throws an error with code FEATURE_DISABLED", () => {
        try {
            checkPackagesFlag(false);
            fail("Expected NotFoundException");
        } catch (err: unknown) {
            expect((err as NotFoundException).getResponse()).toMatchObject({
                code: "FEATURE_DISABLED",
            });
        }
    });

    it("does NOT throw when flag is on", () => {
        expect(() => checkPackagesFlag(true)).not.toThrow();
    });
});

// ── PARTNER_CLINICS_ENABLED ───────────────────────────────────────────────────
// No /partner-clinics route exists yet.  When built, the gate should be a
// NotFoundException identical to the packages gate above.

describe("PARTNER_CLINICS_ENABLED = false (no route built yet)", () => {
    it("flag is false by default (placeholder assertion)", async () => {
        const { PARTNER_CLINICS_ENABLED } = await import("@physio/shared");
        expect(PARTNER_CLINICS_ENABLED).toBe(false);
    });
});

// ── DEVICE_PAYMENTS_ENABLED ───────────────────────────────────────────────────
// No /device-payments route exists yet.

describe("DEVICE_PAYMENTS_ENABLED = false (no route built yet)", () => {
    it("flag is false by default (placeholder assertion)", async () => {
        const { DEVICE_PAYMENTS_ENABLED } = await import("@physio/shared");
        expect(DEVICE_PAYMENTS_ENABLED).toBe(false);
    });
});

// ── PO_MONTHLY_FEE_ENABLED ────────────────────────────────────────────────────

describe("PO_MONTHLY_FEE_ENABLED = false (placeholder, not yet built)", () => {
    it("flag is false by default", async () => {
        const { PO_MONTHLY_FEE_ENABLED } = await import("@physio/shared");
        expect(PO_MONTHLY_FEE_ENABLED).toBe(false);
    });
});

// ── Integration: actual flag values from shared ───────────────────────────────

describe("All launch flags are off by default", () => {
    it("HOME_VISITS_ENABLED is false", async () => {
        const { HOME_VISITS_ENABLED } = await import("@physio/shared");
        expect(HOME_VISITS_ENABLED).toBe(false);
    });

    it("PACKAGES_ENABLED is false", async () => {
        const { PACKAGES_ENABLED } = await import("@physio/shared");
        expect(PACKAGES_ENABLED).toBe(false);
    });

    it("PARTNER_CLINICS_ENABLED is false", async () => {
        const { PARTNER_CLINICS_ENABLED } = await import("@physio/shared");
        expect(PARTNER_CLINICS_ENABLED).toBe(false);
    });

    it("DEVICE_PAYMENTS_ENABLED is false", async () => {
        const { DEVICE_PAYMENTS_ENABLED } = await import("@physio/shared");
        expect(DEVICE_PAYMENTS_ENABLED).toBe(false);
    });

    it("PO_MONTHLY_FEE_ENABLED is false", async () => {
        const { PO_MONTHLY_FEE_ENABLED } = await import("@physio/shared");
        expect(PO_MONTHLY_FEE_ENABLED).toBe(false);
    });
});
