/**
 * Tunable policy defaults for the Rehab360 care flow.
 * Override individual values with env vars where noted.
 * All times are in minutes unless the name says otherwise.
 *
 * Decisions confirmed by Victor Adelua, 2026-11-17:
 *  - First consult ₦10,000 / follow-up ₦5,000 (all disciplines)
 *  - Commission 10%, service fee 5% capped ₦500
 *  - Partner clinic fee 10%
 *  - Packages: 3, 5, 10 sessions; 90-day expiry; discount = waive service fee
 *  - Payout 24 h after note signed, business days only
 *  - Messaging windows: 30 min per exchange (between sessions)
 *  - Repeat-patient commission: flat rate (no discount for now)
 *  - No fabrication price cap at launch
 *  - Pro exercise videos via YouTube link only (reviewed before use)
 */

// ── Slot / availability ───────────────────────────────────────────────────────

/** Default session length when the professional hasn't set their own. */
export const DEFAULT_SESSION_MIN = 45;

/** Default buffer (gap between sessions) for a professional. */
export const DEFAULT_BUFFER_MIN = 15;

/** How long a slot hold lives before it expires (freeing the slot). */
export const SLOT_HOLD_MINUTES = 10;

// ── Session room ──────────────────────────────────────────────────────────────

/** How early a participant may join before the session start time. */
export const JOIN_WINDOW_MIN = 15;

/** Hard-cut a session after this many minutes (failsafe). */
export const SESSION_HARD_END_MIN = 90;

/**
 * How many minutes after the session's scheduled end time the Daily room stays
 * open before auto-ejecting everyone.  Keeps rooms from lingering for hours.
 */
export const VIDEO_ROOM_GRACE_MIN = 30;

/**
 * If video fails, the session falls back to chat after this many minutes
 * of unrecoverable failure.
 */
export const CALL_FAILURE_FALLBACK_MIN = 5;

/**
 * Patient may cancel with a full refund if the professional is more than
 * this many minutes late to join.
 */
export const PRO_LATE_CANCEL_MIN = 15;

// ── Prices (platform-set, in kobo; 1 NGN = 100 kobo) ─────────────────────────

/** First consultation price for all disciplines. ₦10,000. */
export const FIRST_CONSULT_PRICE_KOBO = 1_000_000;

/** Follow-up session price for all disciplines. ₦5,000. */
export const FOLLOW_UP_PRICE_KOBO = 500_000;

// ── Commission and fees ───────────────────────────────────────────────────────

/**
 * Platform commission in basis points (1 bps = 0.01%).
 * 1000 bps = 10%. Hard ceiling: loader must refuse any value > 1000.
 * Override with env var PLATFORM_FEE_BPS.
 */
export const PLATFORM_FEE_BPS: number = (() => {
    const v = Number(
        typeof process !== "undefined" ? (process.env["PLATFORM_FEE_BPS"] ?? 1000) : 1000,
    );
    if (v > 1000) throw new Error(`PLATFORM_FEE_BPS ${v} exceeds the hard ceiling of 1000 bps`);
    return v;
})();

/** Alias — use PLATFORM_FEE_BPS in payment code, COMMISSION_BPS in copy. */
export const COMMISSION_BPS = PLATFORM_FEE_BPS;

/**
 * Service fee charged to the patient, in basis points of the price subtotal.
 * 500 bps = 5%.  The professional never sees this fee.
 */
export const SERVICE_FEE_BPS = 500;

/** Maximum service fee in kobo. ₦500. */
export const SERVICE_FEE_CAP_KOBO = 50_000;

/**
 * Compute the service fee for a given price subtotal.
 * Returns an integer in kobo, capped at SERVICE_FEE_CAP_KOBO.
 */
export function calcServiceFee(priceKobo: number): number {
    return Math.min(
        Math.round((priceKobo * SERVICE_FEE_BPS) / 10_000),
        SERVICE_FEE_CAP_KOBO,
    );
}

/**
 * Compute the commission (Rehab360's share) for a given price, in kobo.
 * Rounds half-up to the nearest kobo.
 */
export function calcCommission(priceKobo: number): number {
    return Math.round((priceKobo * COMMISSION_BPS) / 10_000);
}

/** Partner clinic booking-and-payment service fee, in basis points. 10%. */
export const PARTNER_CLINIC_SERVICE_FEE_BPS = 1000;

/**
 * Full fee breakdown for a session charge.
 * Returns all amounts in kobo (integers).
 *
 * @param priceKobo   Base session price (e.g. FIRST_CONSULT_PRICE_KOBO)
 * @param videoAddon  true if the video add-on should be included
 */
export function calcFeeBreakdown(priceKobo: number, videoAddon = false): {
    serviceFeeKobo: number;
    commissionKobo: number;
    videoAddonKobo: number;
    physioPayout: number;
    platformRevenue: number;
    patientTotal: number;
} {
    const serviceFeeKobo = calcServiceFee(priceKobo);
    const commissionKobo = calcCommission(priceKobo);
    const videoAddonKobo = videoAddon ? VIDEO_ADDON_KOBO : 0;
    const physioPayout = priceKobo - commissionKobo;
    const platformRevenue = commissionKobo + serviceFeeKobo + videoAddonKobo;
    const patientTotal = priceKobo + serviceFeeKobo + videoAddonKobo;
    return { serviceFeeKobo, commissionKobo, videoAddonKobo, physioPayout, platformRevenue, patientTotal };
}

/**
 * Price of a video add-on when bundled with a text/chat consultation. ₦500.
 * Placeholder value for launch — to be confirmed.
 */
export const VIDEO_ADDON_KOBO = 50_000;

/**
 * Number of free introductory video sessions per new patient.
 * Placeholder for launch — not yet enforced in booking logic.
 */
export const FREE_INTRO_VIDEO_SESSIONS = 2;

/**
 * Price of a chat (messaging) session. Same as a follow-up at launch.
 */
export const CHAT_PRICE_KOBO = FOLLOW_UP_PRICE_KOBO;

// ── Launch-ceiling validator ──────────────────────────────────────────────────
// COMMISSION_BPS is already validated in its own IIFE (> 1000 throws).
// This secondary check makes the invariant explicit for COMMISSION_BPS alias.
if (COMMISSION_BPS > 1000) throw new Error("COMMISSION_BPS exceeds the launch ceiling of 1000 bps");

// ── Payments / release ────────────────────────────────────────────────────────

/**
 * Hours after the session note is signed off before the platform releases
 * the professional's earnings.  Gives the patient a dispute window.
 */
export const RELEASE_DELAY_HOURS = 24;

/**
 * Release only happens on business days (Mon–Fri, excluding Nigerian public
 * holidays).  If the 24-hour window ends on a weekend, release runs on the
 * next business day morning.
 */
export const PAYOUT_BUSINESS_DAYS_ONLY = true;

/**
 * Hours within which a patient may open a dispute after the session ends.
 * Must be <= RELEASE_DELAY_HOURS.
 */
export const DISPUTE_WINDOW_HOURS = 24;

// ── Cancellation policy ───────────────────────────────────────────────────────

/**
 * Patients who cancel at least this many hours before the session receive
 * a full refund including the service fee.
 */
export const PATIENT_CANCEL_FREE_HOURS = 24;

/**
 * Patients who cancel between LATE_CANCEL_WINDOW_HOURS and
 * PATIENT_CANCEL_FREE_HOURS before the session receive a partial refund.
 */
export const LATE_CANCEL_WINDOW_HOURS = 6;

/** Percentage of the price refunded on a late cancellation (service fee not refunded). */
export const LATE_CANCEL_REFUND_PCT = 50;

/** Free reschedules per booking (up to PATIENT_CANCEL_FREE_HOURS before). */
export const FREE_RESCHEDULES = 1;

// ── Home visits ───────────────────────────────────────────────────────────────

/** Base fee for a home visit, in kobo. ₦15,000. */
export const HOME_VISIT_BASE_KOBO = 1_500_000;

/** Travel surcharge per km of round-trip distance, in kobo. ₦250/km. */
export const HOME_VISIT_RATE_PER_KM_KOBO = 25_000;

/** Default maximum travel distance a specialist will cover, in km. */
export const HOME_VISIT_DEFAULT_MAX_KM = 15;

/** Full refund if cancelled more than this many hours before the visit. */
export const HOME_VISIT_FREE_CANCEL_HOURS = 48;

/** Partial refund (base 50%, travel 100%) if cancelled between this and 48 h. */
export const HOME_VISIT_PARTIAL_CANCEL_HOURS = 24;

// ── Packages ──────────────────────────────────────────────────────────────────

/** Available package sizes (number of follow-up sessions). */
export const PACKAGE_SIZES = [3, 5, 10] as const;

/** Days before an unused prepaid package expires. */
export const PACKAGE_EXPIRY_DAYS = 90;

/**
 * Package discount mode: the service fee is waived entirely.
 * The professional's price and Rehab360's commission are unchanged.
 */
export const PACKAGE_DISCOUNT_MODE = "WAIVE_SERVICE_FEE" as const;

// ── Messaging ─────────────────────────────────────────────────────────────────

/** Hours within which a professional is expected to reply to a patient message. */
export const MESSAGE_REPLY_EXPECTED_HOURS = 24;

/**
 * Duration of a between-sessions messaging window in minutes.
 * Each exchange (back-and-forth thread) is limited to this window.
 * 30 minutes — same as a video session.
 */
export const MESSAGING_SESSION_MINUTES = 30;

// ── Referrals ─────────────────────────────────────────────────────────────────

/** Days before an unanswered referral is marked STALLED. */
export const REFERRAL_STALL_DAYS = 3;

// ── Patient engagement ────────────────────────────────────────────────────────

/** Days of exercise inactivity before a nudge notification is sent. */
export const INACTIVITY_NUDGE_DAYS = 3;

/** Pain score (1–10) at or above which an alert is sent to the professional. */
export const PAIN_ALERT_THRESHOLD = 8;

// ── Reviews ───────────────────────────────────────────────────────────────────

/** Minimum number of verified reviews before a rating is shown on the public profile. */
export const MIN_REVIEWS_TO_SHOW_RATING = 3;
