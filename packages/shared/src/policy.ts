/**
 * Tunable policy defaults for the Rehab360 care flow.
 * Override individual values with env vars where noted.
 * All times are in minutes unless the name says otherwise.
 */

// ── Slot / availability ───────────────────────────────────────────────────────

/** Default session length when the professional hasn't set their own. */
export const DEFAULT_SESSION_MIN = 45;

/** Default buffer (gap between sessions) for a professional. */
export const DEFAULT_BUFFER_MIN = 15;

/** How long a slot hold lives before it expires (freeing the slot). */
export const SLOT_HOLD_MINUTES = 10;

// ── Session room ──────────────────────────────────────────────────────────────

/** How early / late a participant may join before the hold expires. */
export const JOIN_WINDOW_MIN = 15;

/** Hard-cut a session after this many minutes (failsafe). */
export const SESSION_HARD_END_MIN = 90;

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

// ── Payments ──────────────────────────────────────────────────────────────────

/**
 * Platform fee in basis points (1 bps = 0.01%).
 * Default: 1500 bps = 15%.
 * Override with env var PLATFORM_FEE_BPS.
 */
export const PLATFORM_FEE_BPS = Number(
    typeof process !== "undefined" ? (process.env["PLATFORM_FEE_BPS"] ?? 1500) : 1500,
);

/**
 * Hours after the session note is signed off before the platform releases
 * the professional's earnings.  Gives the patient a dispute window.
 */
export const RELEASE_DELAY_HOURS = 24;

/**
 * Hours within which a patient may open a dispute after the session ends.
 * Must be <= RELEASE_DELAY_HOURS.
 */
export const DISPUTE_WINDOW_HOURS = 24;

// ── Cancellation policy ───────────────────────────────────────────────────────

/**
 * Patients who cancel at least this many hours before the session receive
 * a full refund.  Cancellations after this threshold receive 0%.
 */
export const PATIENT_CANCEL_FREE_HOURS = 24;

// ── Referrals ─────────────────────────────────────────────────────────────────

/** Days before an unanswered referral is marked STALLED. */
export const REFERRAL_STALL_DAYS = 3;

// ── Patient engagement ────────────────────────────────────────────────────────

/** Days of exercise inactivity before a nudge notification is sent. */
export const INACTIVITY_NUDGE_DAYS = 3;

/** Pain score (1–10) at or above which an alert is sent to the professional. */
export const PAIN_ALERT_THRESHOLD = 8;
