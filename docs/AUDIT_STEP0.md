# Step 0 Audit — Online-launch feature surface area

Audited: 2026-11-24

---

## 1. Home visits

**Status: Partially built — data model and admin view exist; booking path is NOT gated.**

| Layer | Location | Notes |
|---|---|---|
| DB schema | `packages/db/prisma/schema.prisma` | `HomeVisit` model, `HomeVisitStatus` enum, `SessionMode.HOME`, `AppointmentType.HOME_VISIT` all defined |
| Policy constants | `packages/shared/src/policy.ts` | `HOME_VISIT_BASE_KOBO`, `HOME_VISIT_RATE_PER_KM_KOBO`, `HOME_VISIT_DEFAULT_MAX_KM`, `HOME_VISIT_FREE_CANCEL_HOURS`, `HOME_VISIT_PARTIAL_CANCEL_HOURS` all present |
| API admin view | `apps/api/src/admin/admin.controller.ts` line 218 | `GET /admin/home-visits` reads HomeVisit rows |
| Admin UI | `apps/web/src/app/(admin)/admin/home-visits/page.tsx` | Lists home visits |
| Booking service | `apps/api/src/booking/booking.service.ts` | `mode` field on appointment accepts `"HOME"` via `SessionMode` zod enum — **no guard/flag in place** |
| BookAppointmentInput | `packages/shared/src/booking.ts` | `mode: SessionMode` where SessionMode includes "HOME" |
| Public pages | `apps/web/src/app/page.tsx` line 81 | Homepage copy mentions "home visit" |
| Physio UI | `apps/web/src/app/pro/appointments/page.tsx` line 19 | "HOME" labelled "Home visit" |
| Public directory | `apps/web/src/app/professionals/professionals-client.tsx` line 16 | Filter pill "Home visit" |
| Physio profile | `apps/web/src/app/pro/profile/page.tsx` line 23 | SESSION_TYPE_LABELS includes HOME |

**Conclusion:** Schema and admin monitor exist but no booking flow implementation for home visits (no geocoding, no matching, no fulfillment UI). The `mode: HOME` field is accepted by the booking API without restriction.

---

## 2. Partner clinics

**Status: Policy constant only — no route, no model, no UI.**

| Layer | Location | Notes |
|---|---|---|
| Policy | `packages/shared/src/policy.ts` line 104 | `PARTNER_CLINIC_SERVICE_FEE_BPS = 1000` declared |
| Public directory | `apps/web/src/app/professionals/professionals-client.tsx` line 16 & 77 | Filter pill "Clinic" and placeholder card "Clinic fitting" in mock data only |

**Conclusion:** No `/clinics` or `/partner-clinics` API route. No `PartnerClinic` DB model. Only a policy constant and two placeholder strings in mock UI data.

---

## 3. Device quotes / staged payments (P&O)

**Status: UI skeleton only — no API, no DB model, no payment logic.**

| Layer | Location | Notes |
|---|---|---|
| Physio UI | `apps/web/src/app/pro/cases/[id]/page.tsx` | Full device-case Kanban UI (ASSESSMENT, MEASURE, FABRICATION, FITTING stages) — all data is mock/placeholder; fetches `/api/proxy/device-cases/:id` which does not resolve to a real API endpoint |
| DB | `packages/db/prisma/schema.prisma` | No `DeviceCase`, `DeviceQuote`, or staged-payment model |
| API | `apps/api/src/` | No device-cases or device-quotes controller/module |

**Conclusion:** Visual design only. No real data layer or payment integration.

---

## 4. Packages (session bundles)

**Status: Fully built — API, DB model, and web UI all exist.**

| Layer | Location | Notes |
|---|---|---|
| DB schema | `packages/db/prisma/schema.prisma` | `Package`, `PackageSession` models present |
| Policy | `packages/shared/src/policy.ts` | `PACKAGE_SIZES`, `PACKAGE_EXPIRY_DAYS`, `PACKAGE_DISCOUNT_MODE` |
| API service | `apps/api/src/packages/packages.service.ts` | `purchase`, `checkout`, `confirmCheckout`, `redeem`, `listMine`, `getOne`, `expireStale` |
| API controller | `apps/api/src/packages/packages.controller.ts` | `POST /packages`, `POST /packages/checkout`, `GET /packages/:id/confirm`, `POST /packages/:id/redeem` |
| Web UI | `apps/web/src/app/app/packages/` | `page.tsx`, `buy/[id]/page.tsx`, `callback/page.tsx`, `[id]/page.tsx` |

**Conclusion:** Packages are fully wired end-to-end with Paystack checkout and wallet support. No feature flag gates it.

---

## 5. Customer-relations role

**Status: Does not exist.**

The `Role` enum (`packages/shared/src/enums.ts` line 43 and `packages/db/prisma/schema.prisma` line 52) only contains: `PATIENT`, `PHYSIO`, `ADMIN`. No `CUSTOMER_RELATIONS` or similar role exists anywhere in the codebase.

---

## 6. Triage tiers

**Status: Fully built.**

| Name | Meaning | Location |
|---|---|---|
| `GREEN` | Safe for online booking, no restrictions | `packages/shared/src/enums.ts` line 52; `packages/db/prisma/schema.prisma` line 73 |
| `AMBER` | Online booking allowed; clinician may recommend home visit | Same |
| `RED` | Online booking blocked; must seek in-person care | Same; enforced in `apps/api/src/booking/booking.service.ts` line 134 |

Triage engine: `apps/api/src/triage/triage.engine.ts` and rules at `apps/api/src/triage/rules.ts`.

---

## 7. Senior specialist role

**Status: Does not exist.**

No `SENIOR_SPECIALIST`, `SENIOR`, or similar role or concept exists in any TypeScript file, schema enum, or Zod validator across the codebase.

---

## 8. Second opinion step

**Status: Does not exist.**

No `secondOpinion`, `second_opinion`, or `SECOND_OPINION` reference appears anywhere in the codebase. The referral system (`apps/api/src/referrals/`) handles cross-specialist referrals but there is no "second opinion" workflow or booking type.

---

## 9. In-person care mentions in public pages / app screens

| File | Line | Mention |
|---|---|---|
| `apps/web/src/app/page.tsx` | 81 | Homepage step copy: "Book a video session or a home visit" |
| `apps/web/src/app/professionals/professionals-client.tsx` | 16 | Filter pill: "Home visit", "Clinic" |
| `apps/web/src/app/professionals/professionals-client.tsx` | 75, 77 | Placeholder professional cards mention "Home visit" and "Clinic fitting" |
| `apps/web/src/app/professionals/[id]/page.tsx` | 94 | "Join by video or receive a home visit." |
| `apps/web/src/app/app/book/[physioId]/page.tsx` | 156 | Triage-RED message: "Your symptoms need urgent in-person evaluation." |
| `apps/web/src/app/pro/availability/page.tsx` | 20 | MODE_LABELS: `HOME: "In person"` |
| `apps/web/src/app/pro/appointments/page.tsx` | 19 | Mode label: `HOME: "Home visit"` |
| `apps/web/src/app/pro/onboarding/apply/page.tsx` | 357 | Input placeholder: "Video, home visit" |
| `apps/web/src/app/pro/profile/page.tsx` | 23 | SESSION_TYPE_LABELS: `HOME: "Home visit"` |
| `apps/web/src/app/pro/page.tsx` | 94 | Appointment display: "Home visit" |

---

## 10. Constants currently in `packages/shared/src/policy.ts`

```
DEFAULT_SESSION_MIN = 45
DEFAULT_BUFFER_MIN = 15
SLOT_HOLD_MINUTES = 10
JOIN_WINDOW_MIN = 15
SESSION_HARD_END_MIN = 90
CALL_FAILURE_FALLBACK_MIN = 5
PRO_LATE_CANCEL_MIN = 15
FIRST_CONSULT_PRICE_KOBO = 1_000_000
FOLLOW_UP_PRICE_KOBO = 500_000
PLATFORM_FEE_BPS (IIFE with env-var support, ceiling 1000)
COMMISSION_BPS = PLATFORM_FEE_BPS (alias)
SERVICE_FEE_BPS = 500
SERVICE_FEE_CAP_KOBO = 50_000
calcServiceFee(priceKobo): number
calcCommission(priceKobo): number
PARTNER_CLINIC_SERVICE_FEE_BPS = 1000
RELEASE_DELAY_HOURS = 24
PAYOUT_BUSINESS_DAYS_ONLY = true
DISPUTE_WINDOW_HOURS = 24
PATIENT_CANCEL_FREE_HOURS = 24
LATE_CANCEL_WINDOW_HOURS = 6
LATE_CANCEL_REFUND_PCT = 50
FREE_RESCHEDULES = 1
HOME_VISIT_BASE_KOBO = 1_500_000
HOME_VISIT_RATE_PER_KM_KOBO = 25_000
HOME_VISIT_DEFAULT_MAX_KM = 15
HOME_VISIT_FREE_CANCEL_HOURS = 48
HOME_VISIT_PARTIAL_CANCEL_HOURS = 24
PACKAGE_SIZES = [3, 5, 10]
PACKAGE_EXPIRY_DAYS = 90
PACKAGE_DISCOUNT_MODE = "WAIVE_SERVICE_FEE"
MESSAGE_REPLY_EXPECTED_HOURS = 24
MESSAGING_SESSION_MINUTES = 30
REFERRAL_STALL_DAYS = 3
INACTIVITY_NUDGE_DAYS = 3
PAIN_ALERT_THRESHOLD = 8
MIN_REVIEWS_TO_SHOW_RATING = 3
```

---

## Summary

| Feature | Built? |
|---|---|
| Home visits | Partial (schema + admin view, no booking flow, no flag) |
| Partner clinics | No (policy constant + placeholder UI only) |
| Device quotes / staged payments | No (UI skeleton only) |
| Packages | Yes (full end-to-end) |
| Customer-relations role | No |
| Triage tiers (GREEN/AMBER/RED) | Yes |
| Senior specialist role | No |
| Second opinion step | No |
