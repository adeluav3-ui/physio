# Rehab360 Pilot Launch Report

## Step 0 — Audit: What the first brief built

The online-launch-scope brief (`feat/online-launch-scope`, merged to `main` 2026-11-24) delivered:

### Feature flags (`packages/shared/src/featureFlags.ts`)
All five launch-gating flags default to `false`:
- `HOME_VISITS_ENABLED` — home-visit booking disabled at launch
- `PARTNER_CLINICS_ENABLED` — partner clinic listing disabled
- `DEVICE_PAYMENTS_ENABLED` — P&O device payments disabled
- `PACKAGES_ENABLED` — session bundles disabled
- `PO_MONTHLY_FEE_ENABLED` — specialist monthly fee disabled

### Fee policy (`packages/shared/src/policy.ts`)
Hard-coded at standard (non-pilot) rates:
- Commission: 1000 bps (10%) on base price only — `PLATFORM_FEE_BPS` / `COMMISSION_BPS`
- Service fee: 500 bps (5%) capped at ₦500 — `SERVICE_FEE_BPS` / `SERVICE_FEE_CAP_KOBO`
- Env-var guard: `PLATFORM_FEE_BPS > 1000` throws at startup
- `calcFeeBreakdown()` returns `{ serviceFeeKobo, commissionKobo, videoAddonKobo, physioPayout, platformRevenue, patientTotal }`

### Video add-on (`packages/shared/src/policy.ts`)
- `VIDEO_ADDON_KOBO = 50_000` (₦500 per session)
- `FREE_INTRO_VIDEO_SESSIONS = 2` (placeholder, not yet enforced in booking logic)
- `VIDEO_ROOM_GRACE_MIN = 30` — Daily room stays open 30 min after session end

### Video provider (`packages/video/src/daily.ts`)
- Recording disabled (`enable_recording: "none"`)
- Room expiry = `endsAt + VIDEO_ROOM_GRACE_MIN` instead of fixed 6-hour window
- `GET /admin/video-minutes` endpoint added

### Triage tiers
- Enum renamed: `AMBER → FLAG`, `RED → IN_PERSON_REQUIRED`
- `RULES_VERSION` bumped to `"2026-11-24"`
- Triage engine uses new level names throughout

### In-person fallback queue
- `FallbackCase` Prisma model — one record per intake, auto-created when triage returns `IN_PERSON_REQUIRED`
- `FallbackCaseStatus` enum: `OPEN | CONTACTED | RESOLVED | CLOSED`
- `GET /admin/fallback-cases` and `PATCH /admin/fallback-cases/:id` admin endpoints
- Admin nav updated: "Fallback queue"
- `BookingService.book()` blocks online booking for `IN_PERSON_REQUIRED` intakes

### Waitlist
Existing `WaitlistEntry` model retained unchanged (open to both patients and specialists at this stage). No consent screen added yet — planned in second brief Step 6.

### Consent screens
Not built in first brief — deferred to Step 6 of this pilot brief.

### Ledger split
`releaseToPhysio()` now creates separate `COMMISSION`, `SERVICE_FEE`, and `PHYSIO_PAYOUT` ledger entries instead of a single `PLATFORM_FEE` entry.

---

## Step 1 — Pilot mode and pilot pricing

> See schema migration `20261125000000_add_pilot_settings` for DB changes.
> `PilotSettings` singleton (id=1), rate-snapshot columns added to `Payment`.
> `calcFeeBreakdownWithRates()` in `policy.ts` accepts explicit BPS values.
> Booking service reads `PilotSettings` at booking time and snapshots rates into `Payment`.
> Admin endpoints: `GET /admin/pilot-settings`, `PUT /admin/pilot-settings`.

---

---

## Step 2 — Founding Specialist badge and admin dashboard

> Schema: `pilotParticipant Boolean @default(false)` added to `PhysioProfile`.
> Migration: `20261125010000_add_physio_pilot_flag`.

- `GET /professionals` and `GET /professionals/:id` now return `pilotParticipant`.
- Amber "Founding Specialist" badge rendered on public profile page when `pilotParticipant === true`.
- Admin: `PATCH /admin/physios/:id/pilot` toggles the flag.
- Admin pilot dashboard: `GET /admin/pilot-dashboard` returns session counts, Daily minutes,
  progress %, pilot specialist count, and current rate summary.
- `/admin/pilot` page added with stat cards, progress bar, and inline settings form.

---

## Step 3 — Enhanced specialist verification (MRTB + rejection reason)

> Schema: `mrtbCheckedAt DateTime?` added to `PhysioProfile`.
> Migration: `20261125020000_add_mrtb_check`.

- `physioVerifySchema` updated: `mrtbChecked: z.boolean().optional()`.
- Admin physio detail page enforces MRTB checkbox before VERIFIED decision.
- Server stores `mrtbCheckedAt` on approval; `rejectedAt` stored on rejection.
- Rejection reason persists to DB (previously discarded).

---

## Step 4 — Simplified in-person triage messaging

- `TriageResultCard` (`packages/ui`) redesigned:
  - `FLAG`: title "Book now — your specialist will review your case".
  - `IN_PERSON_REQUIRED`: title "Your condition needs an in-person assessment" with subtitle
    explaining the follow-up process.
  - Emergency contacts section removed entirely (the admin fallback queue handles follow-up).
- `emergencyContacts` prop removed from component interface and all call sites.

---

## Step 5 — Post-session feedback forms

> Schema: `FeedbackFormType` enum + `SessionFeedback` model.
> Migration: `20261125030000_add_session_feedback`.

Four form types: `PATIENT_SESSION`, `SPECIALIST_SESSION`, `PATIENT_END_OF_PILOT`,
`SPECIALIST_END_OF_PILOT`.

- `POST /feedback` — submit feedback (authenticated, participant-only, duplicate-prevented).
- `GET /feedback/session/:appointmentId` — returns scores to participants, free-text to admins only.
- `GET /feedback/export/csv` — admin-only anonymised CSV (no patient names).
- Web: `/app/session/[id]/feedback?role=patient|physio` — post-session form with pain/function
  sliders (patient only), star ratings, free-text.
- Patient session `leaveSession()` redirects to feedback page.
- Physio note page `onSign()` redirects to feedback page (unless nextStep === "refer").
- Admin pilot page includes "Download feedback CSV" link.

---

## Step 6 — Consent and privacy pages

All pages include `// LAWYER REVIEW REQUIRED` comments on every section needing legal sign-off.

| Page | Route |
|---|---|
| Privacy Notice | `/legal/privacy` |
| Terms of Service | `/legal/terms` |
| Founding Specialist Pilot Agreement | `/legal/pilot-agreement` |

- Patient signup consent checkbox now links to Terms and Privacy.
- Pro signup consent additionally shows Pilot Agreement link.
- Specialist apply page step 5 (Review) requires pilot agreement acceptance before submission.
- Footer links added to all three legal pages.

**Action required before launch:** Legal review of all three documents. Each section needing
input is marked `[REVIEW]`.

---

## Step 7 — Specialist-only waitlist + landing page overhaul

**Waitlist:**
- `WaitlistForm` component reduced to specialist-only: patient toggle removed.
- CTA changed to "Join as a Founding Specialist".
- Admin waitlist page defaults to hiding PATIENT rows; "Show patient entries" checkbox reveals them.

**Landing page:**
- Hero chip: "Opening soon" → "Pilot launching 1 December 2026".
- Hero CTA: "I need care" button → `/auth/signup`; "I provide care" anchor → `#specialists`.
- How it works: expanded to 4 steps, includes "Follow your plan" step.
- New "Founding Specialist Programme" dark section with benefit list + waitlist form.
- FAQ expanded: added pilot, payment, and records questions.
- Footer: links to Privacy, Terms, Pilot Agreement, and /professionals.
- Open Graph: `og:title`, `og:description`, `og:image`, Twitter card metadata updated.

---

## Step 8 — Playwright tests

File: `apps/e2e/tests/10-pilot.spec.ts` — 11 scenarios:

1. Landing page shows "Pilot launching 1 December 2026" chip
2. "Book a session" CTA navigates to `/auth/signup`
3. "Join as a specialist" anchor has correct `href="#specialists"`
4. Waitlist form shows no patient toggle (specialist-only)
5. Privacy policy page renders without horizontal scroll
6. Terms of service page renders
7. Pilot agreement page renders
8. Patient signup consent links to `/legal/terms` and `/legal/privacy`
9. Pro signup consent includes `/legal/pilot-agreement` link
10. Admin waitlist defaults to hiding patient entries (skipped if admin creds not set)
11. Patient feedback form renders with pain and function sliders

---

## Security constraints — compliance checklist

| Constraint | Status |
|---|---|
| No secrets in repo; all config from env | ✅ All new env vars added to `.env.example` via existing pattern |
| Money written only through immutable ledger | ✅ Rate snapshots written at booking time, never updated |
| `PaymentProvider`, `VideoProvider`, `DistanceProvider` abstractions maintained | ✅ No direct provider calls added |
| Paystack TEST mode only | ✅ Not changed |
| `COMMISSION_BPS` hard ceiling ≤ 1000 | ✅ `PUT /admin/pilot-settings` enforces `commissionBps <= 1000` |
| Clinical notes never in URLs / emails | ✅ Feedback routes carry only appointment IDs |
| `DAILY_API_KEY` never logged/committed | ✅ No new logging of video credentials |
| YouTube embeds use `youtube-nocookie.com` | ✅ Existing constraint unchanged |
| Delete endpoint rejects exercises referenced by ProgramItem | ✅ Existing constraint unchanged |
| AuditLog for every clinical record read | ✅ Feedback uses appointment ID only; no clinical record reads added without audit |

---

## Open items before launch

1. **Legal review** of `/legal/privacy`, `/legal/terms`, `/legal/pilot-agreement` — all `[REVIEW]` sections.
2. **OG image** at `/public/brand/og-image.png` (1200×630) — file must exist for Open Graph to work.
3. **WhatsApp links** for each discipline (`NEXT_PUBLIC_WHATSAPP_PHYSIO` etc.) — add to Vercel env.
4. **Payout schedule** in Pilot Agreement section 4 — confirm number of business days.
5. **Parental consent flow** — Terms section 2 marks this as not yet implemented; needed before GA.
6. **Withholding tax** — confirm obligations with accountant before first specialist payout.
7. **End-of-pilot feedback forms** (`PATIENT_END_OF_PILOT`, `SPECIALIST_END_OF_PILOT`) — trigger
   mechanism not yet implemented; will need a job or admin action at pilot end.

