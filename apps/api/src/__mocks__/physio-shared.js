// CJS stub for @physio/shared used in jest unit tests.
// Keep in sync with packages/shared/src/policy.ts defaults.
"use strict";

const { z } = require("zod");

// ── Policy constants ──────────────────────────────────────────────────────────
module.exports.PLATFORM_FEE_BPS = 1500;
module.exports.SLOT_HOLD_MINUTES = 10;
module.exports.DEFAULT_SESSION_MIN = 45;
module.exports.DEFAULT_BUFFER_MIN = 15;
module.exports.JOIN_WINDOW_MIN = 15;
module.exports.CALL_FAILURE_FALLBACK_MIN = 5;
module.exports.PRO_LATE_CANCEL_MIN = 15;
module.exports.RELEASE_DELAY_HOURS = 24;
module.exports.DISPUTE_WINDOW_HOURS = 24;
module.exports.PATIENT_CANCEL_FREE_HOURS = 24;
module.exports.REFERRAL_STALL_DAYS = 3;
module.exports.INACTIVITY_NUDGE_DAYS = 3;
module.exports.PAIN_ALERT_THRESHOLD = 8;
module.exports.MESSAGE_REPLY_EXPECTED_HOURS = 24;
module.exports.MIN_REVIEWS_TO_SHOW_RATING = 3;

// ── Red-flag words (safe stub) ────────────────────────────────────────────────
module.exports.hasRedFlagWords = (_text) => false;

// ── Brand ─────────────────────────────────────────────────────────────────────
module.exports.BRAND = { name: "Rehab360", primaryColor: "#1b7d0e" };

// ── Shared schemas / helpers ──────────────────────────────────────────────────
module.exports.idSchema = z.string().uuid();
module.exports.ReferralStatus = {
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    DECLINED: "DECLINED",
    STALLED: "STALLED",
    CLOSED: "CLOSED",
};
