import { describe, it, expect } from "vitest";
import {
    calcFeeBreakdown,
    FIRST_CONSULT_PRICE_KOBO,
    FOLLOW_UP_PRICE_KOBO,
    VIDEO_ADDON_KOBO,
} from "./policy.js";

describe("calcFeeBreakdown", () => {
    it("first consult: patient pays ₦10,500 — physio gets ₦9,000 — platform gets ₦1,500", () => {
        const r = calcFeeBreakdown(FIRST_CONSULT_PRICE_KOBO);
        expect(r.patientTotal).toBe(1_050_000);   // ₦10,500
        expect(r.physioPayout).toBe(900_000);      // ₦9,000
        expect(r.platformRevenue).toBe(150_000);   // ₦1,500
        expect(r.commissionKobo).toBe(100_000);    // ₦1,000 (10% of ₦10,000)
        expect(r.serviceFeeKobo).toBe(50_000);     // ₦500 (5% of ₦10,000, capped)
        expect(r.videoAddonKobo).toBe(0);
    });

    it("follow-up: patient pays ₦5,250 — physio gets ₦4,500 — platform gets ₦750", () => {
        const r = calcFeeBreakdown(FOLLOW_UP_PRICE_KOBO);
        expect(r.patientTotal).toBe(525_000);      // ₦5,250
        expect(r.physioPayout).toBe(450_000);      // ₦4,500
        expect(r.platformRevenue).toBe(75_000);    // ₦750
        expect(r.commissionKobo).toBe(50_000);     // ₦500 (10% of ₦5,000)
        expect(r.serviceFeeKobo).toBe(25_000);     // ₦250 (5% of ₦5,000)
        expect(r.videoAddonKobo).toBe(0);
    });

    it("first consult + video add-on: patient pays ₦11,000 — physio still gets ₦9,000", () => {
        const r = calcFeeBreakdown(FIRST_CONSULT_PRICE_KOBO, true);
        expect(r.patientTotal).toBe(1_100_000);    // ₦11,000
        expect(r.physioPayout).toBe(900_000);      // ₦9,000 (unchanged)
        expect(r.videoAddonKobo).toBe(VIDEO_ADDON_KOBO); // ₦500 add-on
        expect(r.commissionKobo).toBe(100_000);    // commission on base, not on add-on
        expect(r.platformRevenue).toBe(200_000);   // ₦1,000 commission + ₦500 service fee + ₦500 add-on
    });

    it("service fee is capped at ₦500 for first consult", () => {
        const r = calcFeeBreakdown(FIRST_CONSULT_PRICE_KOBO);
        expect(r.serviceFeeKobo).toBe(50_000); // capped, not 50_000 would be 5% anyway
    });

    it("service fee is not capped for follow-up (5% of ₦5,000 = ₦250 < cap)", () => {
        const r = calcFeeBreakdown(FOLLOW_UP_PRICE_KOBO);
        expect(r.serviceFeeKobo).toBe(25_000); // 5% of ₦5,000 = ₦250, below cap
    });

    it("commission only applies to base price, never to service fee", () => {
        // If commission applied to gross (base + service fee), first consult commission would be
        // 10% of ₦10,500 = ₦1,050, but it must be ₦1,000 (10% of ₦10,000 only)
        const r = calcFeeBreakdown(FIRST_CONSULT_PRICE_KOBO);
        expect(r.commissionKobo).toBe(100_000); // 10% of base only
        expect(r.commissionKobo).not.toBe(105_000); // NOT 10% of gross
    });
});
