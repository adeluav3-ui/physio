# Rehab360 — Online-Launch Scope Report

Branch: `feat/online-launch-scope`
Completed: 2026-11-25

---

## Summary

This branch aligns the codebase with the online-only launch plan. All nine
steps from the brief are addressed. No features were removed from the codebase;
unfinished features are guarded by feature flags or are otherwise unreachable
without deliberate admin action.

---

## Steps completed

### Step 0 — Audit
See `docs/AUDIT_STEP0.md` for the full surface-area audit performed before
any changes were made.

### Step 1 — Feature flags
`packages/shared/src/featureFlags.ts` exports five boolean flags, all `false`
at launch:

| Flag | Guards |
|---|---|
| `HOME_VISITS_ENABLED` | `mode: HOME` in booking API |
| `PARTNER_CLINICS_ENABLED` | (future partner-clinic routes) |
| `DEVICE_PAYMENTS_ENABLED` | (future P&O staged-payment routes) |
| `PACKAGES_ENABLED` | (future – packages are built but not gate-checked yet) |
| `PO_MONTHLY_FEE_ENABLED` | (future P&O subscription) |

The booking service (`apps/api/src/booking/booking.service.ts`) rejects
`mode: HOME` with `FEATURE_DISABLED` while `HOME_VISITS_ENABLED = false`.

### Step 2 — Pricing / fees / ledger
- `policy.ts`: added `VIDEO_ADDON_KOBO`, `FREE_INTRO_VIDEO_SESSIONS`,
  `CHAT_PRICE_KOBO`, `calcFeeBreakdown()`, and a hard ceiling assertion for
  `COMMISSION_BPS > 1000`.
- Ledger `type` enum: added `COMMISSION`, `SERVICE_FEE`, `VIDEO_ADDON`,
  `PROCESSOR_FEE` (migration `20261124010000`).
- `releaseToPhysio()` now records separate `COMMISSION` and `SERVICE_FEE`
  entries. Commission applies to the base booking price only; the service fee
  is never touched by the commission calculation.
- Fee verification: `packages/shared/src/policy.spec.ts` — 6 tests confirm
  the three canonical scenarios from the brief:
  - First consult: patient ₦10,500 / physio ₦9,000 / platform ₦1,500
  - Follow-up: patient ₦5,250 / physio ₦4,500 / platform ₦750
  - First consult + video add-on: patient ₦11,000 / physio still ₦9,000

### Step 3 — Video modes
- `daily.ts`: room expiry set to `endsAt + VIDEO_ROOM_GRACE_MIN (30 min)`
  instead of a blanket 6 hours; `enable_recording: "none"` and
  `enable_recording_ui: false` added to block cloud recording.
- `VideoProvider.createRoom` now accepts optional `endsAt?: string`;
  `sessions.service.ts` passes `appt.endsAt.toISOString()`.
- Admin counter: `GET /admin/video-minutes` returns `sessionCount` and
  `totalMinutes` for all completed Daily sessions.

### Step 4a — Triage renames
`GREEN / AMBER / RED` → `GREEN / FLAG / IN_PERSON_REQUIRED`

| Old | New | Meaning |
|---|---|---|
| GREEN | GREEN | Safe for online booking |
| AMBER | FLAG | Online booking allowed; physio should review carefully |
| RED | IN_PERSON_REQUIRED | Online booking blocked; must attend in person |

- DB migration `20261124020000` renames enum values via `ALTER TYPE … RENAME VALUE`.
- `RULES_VERSION` bumped to `2026-11-24`; all rule IDs updated (`red.*` →
  `in_person.*`, `amber.*` → `flag.*`).
- Booking error code changed: `TRIAGE_RED` → `TRIAGE_IN_PERSON_REQUIRED`.
- All TypeScript type references updated across API, shared, and web packages.

### Step 4b — FallbackCase admin queue
When a patient is triaged `IN_PERSON_REQUIRED`, a `FallbackCase` row is
auto-created in the same transaction (status `OPEN`). The admin team uses
this queue to follow up and signpost patients to in-person services.

- Prisma model: `FallbackCase` with `FallbackCaseStatus` enum
  (`OPEN → CONTACTED → RESOLVED → CLOSED`).
- Migration `20261124030000` creates the table and enum.
- Admin API: `GET /admin/fallback-cases` (filterable by status),
  `PATCH /admin/fallback-cases/:id` (status + note update).
- Admin UI: `/admin/fallback-cases` with inline status-advance action buttons.

### Step 5 — P&O admin-queue item
Deferred to a later sprint. `DEVICE_PAYMENTS_ENABLED = false` gates all future
P&O routes. The existing `DeviceCase` UI is unreachable from production because
it fetches from `/api/proxy/device-cases/:id` which has no server-side handler.

### Step 6 — Waitlist / UTM / WhatsApp
WhatsApp channel env vars (`NEXT_PUBLIC_WHATSAPP_*`) already exist in
`.env.example`. UTM parameter wiring and consent checkbox on the waitlist
form are deferred to the launch-week sprint.

### Step 7 — Remove in-person copy
Public-facing pages updated to reflect online-only positioning:

| File | Change |
|---|---|
| `apps/web/src/app/page.tsx` | "video session or a home visit" → "video session" |
| `professionals-client.tsx` | Removed "Home visit" / "Clinic" session-type pills; sample cards show "Video" only |
| `professionals/[id]/page.tsx` | "Join by video or receive a home visit" → "Join your specialist by video from anywhere" |
| `pro/onboarding/apply/page.tsx` | Placeholder "Video, home visit" → "Video" |

### Step 8 — `.env.example` fix
`PLATFORM_FEE_BPS` corrected from `1500` to `1000`. The 1500 value would
cause the app to throw at boot (`PLATFORM_FEE_BPS exceeds the hard ceiling of
1000 bps`).

---

## What is NOT included at launch

| Item | Status | Notes |
|---|---|---|
| Home visit booking flow | Blocked by flag | Schema and admin monitor exist |
| Partner clinic routes | No routes/models | Policy constant only |
| Device quotes / P&O staged payments | No routes/models | UI skeleton only |
| Packages (session bundles) | Built end-to-end | Not gated; can be enabled without code change |
| Customer-relations role | Does not exist | Never built |
| Senior specialist role | Does not exist | Never built |
| Second opinion workflow | Does not exist | Never built |

---

## Migrations applied (this branch)

| Migration | Description |
|---|---|
| `20261124010000_add_ledger_entry_types` | COMMISSION, SERVICE_FEE, VIDEO_ADDON, PROCESSOR_FEE enum values |
| `20261124020000_rename_triage_levels` | AMBER → FLAG, RED → IN_PERSON_REQUIRED |
| `20261124030000_add_fallback_case` | FallbackCase table + FallbackCaseStatus enum |
