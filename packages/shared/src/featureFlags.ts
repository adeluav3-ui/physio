/**
 * Online-launch feature flags.
 * Set to `true` only after the feature has been fully built, tested, and
 * reviewed.  All flags default to `false` for the initial launch.
 */

/** Home-visit booking (scheduler, geo-matching, fulfilment). */
export const HOME_VISITS_ENABLED = false;

/** Partner clinic listing and booking. */
export const PARTNER_CLINICS_ENABLED = false;

/** Prosthetics & orthotics device quotes and staged payments. */
export const DEVICE_PAYMENTS_ENABLED = false;

/** Session-bundle packages (3 / 5 / 10 follow-ups). */
export const PACKAGES_ENABLED = false;

/** Monthly platform fee for physio professionals (not yet built). */
export const PO_MONTHLY_FEE_ENABLED = false;
