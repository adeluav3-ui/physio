# REHAB360: BUILD THE FULL CARE FLOW

You are continuing work on Rehab360, a hybrid online and in-person rehabilitation platform for Nigeria (physiotherapy, occupational therapy, speech and language therapy, prosthetics, orthotics). Repo: `adeluav3-ui/physio`. Start from branch `feat/rehab360-redesign` and create `feat/care-flow` from it. All earlier branches are stacked and unmerged; do not merge anything to `main`, do not deploy, do not touch production. Victor will approve a merge later.

Read first, in this order: `CLAUDE.md` if present, `design/rehab360-design/README.md`, `design/rehab360-design/BRAND.md`, `design/rehab360-design/tokens.css`, the Prisma schema, and the existing API modules. Use the design files in `design/rehab360-design/reference/` as the visual source of truth for every screen. Match them exactly: Figtree, brand tokens, 5px gradient strip, patient / professional / admin shells. The care-flow screens have mockups too: `ConsultRoom`, `ConsultChat`, `NoteSignoff`, `Availability`, `ChoosePhysio`. Match them exactly. Where no mockup exists (discharge and reassessment screens, messaging between sessions), build from the layout described below using the same tokens and components. Do not invent new colours.

## Working rules

1. Reuse what exists. Do not rewrite working modules (auth, ledger, audit log, triage rules, referral state machine, GoalPlans, exercise program code). Extend them.
2. Every phase ends with: type-check clean, lint clean, unit tests passing, E2E extended, and one commit with a clear message. Do not start the next phase until the current one passes.
3. Money is only ever written through the immutable ledger. Never update or delete a ledger row. Provider calls stay behind `PaymentProvider` and `VideoProvider`. Paystack runs in TEST mode only.
4. Every read of a clinical record writes an AuditLog entry (NDPA). Clinical notes are never logged, never put in URLs, never sent in email bodies (emails carry links only).
5. Times are stored in UTC and displayed in West Africa Time (Africa/Lagos).
6. No secrets in the repo. Read config from env. Add every new variable to `.env.example`.
7. Product text is plain, calm and short. No exclamation marks. Never use the word "AI" in patient-facing copy.
8. Tunable business rules live in one config file (`packages/shared/src/policy.ts`) with the defaults below, so Victor can change them without code edits.

## Policy defaults (put these in policy.ts)

- `SLOT_HOLD_MINUTES = 10`
- `SESSION_MINUTES = 30 | 45` (professional chooses), `BUFFER_MINUTES` per professional
- `FREE_CANCEL_HOURS = 24`; late cancel refund percent `LATE_CANCEL_REFUND_PCT = 0`
- `FREE_RESCHEDULES = 1` (up to 24 hours before)
- `PRO_LATE_CANCEL_MINUTES = 15` (patient may cancel with full refund if the professional is later than this)
- `CALL_FAILURE_FALLBACK_MINUTES = 5` (then fall back to chat)
- `RELEASE_DELAY_HOURS = 24` after the note is signed, if no dispute
- `PLATFORM_FEE_BPS = 1500`
- `PAYOUT_SCHEDULE = WEEKLY`
- `REFERRAL_STALL_DAYS = 3`
- `INACTIVITY_NUDGE_DAYS = 3`
- `MESSAGE_REPLY_EXPECTED_HOURS = 24`
- `JOIN_WINDOW_MINUTES = 15` before start
- `MIN_REVIEWS_TO_SHOW_RATING = 3`

## Phase 0: Audit (read-only, then commit one file)

Write `docs/FLOW_STATUS.md`. For every numbered step in the flow below, list: what exists (file paths), what is partial, what is missing, and any bug you can see by reading. State test counts honestly: unit tests passing and E2E assertions passing, from actually running them. Mark every UI page as "type-checked only" or "browser-verified". Commit it, then continue to Phase 1 without waiting.

## Phase 1: Availability and slots

- Professional availability editor (weekly pattern, session length, buffer, days off, accepting patients on/off). Screen at `/pro/availability`.
- Slot generation from the pattern in WAT, excluding days off, existing bookings and active holds. Slots are computed, not stored far ahead; store bookings and holds.
- Slot hold: creating a hold reserves the slot for `SLOT_HOLD_MINUTES`; a BullMQ job releases expired holds. Two patients can never hold or book the same slot (database constraint plus a transaction).
- `GET` next-available-slot per professional for use in ranking.
- Tests: concurrency test where two requests race for one slot and exactly one wins.

## Phase 2: Sign-up, safety check, and choosing a physiotherapist

Flow: sign up (name, email, password, terms) → verify email (booking locked until verified) → who is it for (myself, child, relative; caregiver can manage dependents) → what is the problem → red-flag questions → result.

- Result handling: RED blocks booking and shows the emergency screen; AMBER allows booking, shows a short caution, and flags the professional; GREEN continues. Keep the existing RULES_VERSION mechanism and store the version with the result.
- Intake answers become the intake summary the physiotherapist reads before the session.
- **Choosing a physiotherapist: ONE full list of every verified physiotherapist. There is no top-three, no recommended carousel.** Ranking, applied in this order:
  1. Area of practice matches the problem (best fit first)
  2. Offers the visit type the patient chose (video, chat, in person near them)
  3. Speaks the patient's language
  4. Soonest available slot
  5. Rating and completed sessions as the final tiebreaker only
  Not accepting patients, or no open slots: sink to the bottom and mark them.
- Each row: photo, name, area of practice, languages, price, rating (only if at least `MIN_REVIEWS_TO_SHOW_RATING`), next free time, Book button. Row opens the public profile.
- Filters: area, language, price, gender, day, visit type. Filtering keeps the ranking order. Sort options: Ranked (default), Soonest available, Lowest price, Highest rated.
- Optional "Match me quickly" button above the list: picks the top-ranked physiotherapist with the earliest slot, shows who it is, and requires the patient to confirm before anything is paid.
- Exceptions to physiotherapist-first: speech or swallowing problems may go straight to a speech therapist; users with an existing prosthesis or brace, or arriving with a doctor's referral, may book that specialist directly.
- Waitlist for a chosen physiotherapist with no free slot.
- Put the ranking in a pure, well-tested function with a documented explanation of the result order.

## Phase 3: Booking and payment

1. Patient picks a slot and visit type. Create the hold. Show price and cancellation rules before paying.
2. Paystack checkout (test mode): card, bank transfer, USSD. Verify with webhook (signature checked, idempotent) and a server-side verify call.
3. Payment success confirms the booking inside one transaction and writes ledger CHARGE then HOLD. Hold expired or payment failed: booking not confirmed, hold released.
4. Emails via Resend (templates in the brand): booking confirmation with an `.ics` calendar file, reminders at 24 hours and 1 hour via BullMQ.
5. Cancel and reschedule with the rules from policy.ts. Refund writes a ledger REFUND. Cases to implement and test: patient cancels early (full refund), patient cancels late (`LATE_CANCEL_REFUND_PCT`), professional cancels or does not show (full refund and rebook offer), patient no-show (no refund), technical failure (rebook free or refund, chosen by admin), dispute within 24 hours (money stays held until admin decides).
6. Release: after the note is signed and `RELEASE_DELAY_HOURS` pass without a dispute, write RELEASE, PLATFORM_FEE, PHYSIO_PAYOUT (the professional's earnings queue). A weekly payout batch job creates a payout list that admin marks paid (bank transfer is manual at first). Earnings page for professionals; payments and ledger page for admin (already exists, extend).
7. Referral sessions are paid the same way to the receiving professional. No money ever moves between professionals.

## Phase 4: The consultation room

- Join button appears `JOIN_WINDOW_MINUTES` before start for both people. Patient device check (camera, mic, connection) before entering.
- Three modes chosen at booking: **video** (default, with switch to audio-only without leaving the room), **live chat consultation** (same room, photos and voice notes allowed, same fee, same documentation), **in person** (booking, payment and notes only; no video room).
- Daily room created behind `VideoProvider`; tokens short-lived, one per participant, scoped to the booking.
- Professional layout (desktop, three panes):
  - Left: patient summary (name, age, reason, triage result, intake answers, past notes, outcome scores, current plan).
  - Centre: large video or chat, small self-view, mute, camera, switch to audio, share screen, session timer with time left.
  - Right: four tabs, **Notes**, **Exercises**, **Plan**, **Refer**.
- Patient layout (phone): full-screen video, controls at the bottom, chat drawer slides up, exercise card appears live when the professional adds one, post-session summary screen at the end.
- Failure handling: either person can rejoin; if the call is down more than `CALL_FAILURE_FALLBACK_MINUTES`, fall back to chat; if the professional is later than `PRO_LATE_CANCEL_MINUTES`, patient gets a cancel-for-full-refund option.
- **End session** opens the note step. The booking is not complete until the note is signed.
- Provide a development fake provider for video so E2E tests run without Daily.

## Phase 5: Exercise library and the home programme

- Library: search by body area, condition, goal and equipment; ready-made protocols; preview with video, plain-language instructions, precautions, progressions; default dose (sets, reps, hold, times per day).
- `clinicalReview` flag: only reviewed items can be added to a real patient plan. New items from professionals start as draft and need admin review. Seed content stays marked unreviewed unless already reviewed.
- In the Exercises tab: add to plan with one tap, edit dose inline, show live to the patient (pushes the card to the patient's room), send plan (patient is notified in app and by email).
- Patient "Today" list: video, dose, Done button, then a feel rating (easy, okay, painful). Pain above a threshold shows a gentle warning and notifies the professional.
- Progress: daily completion and streak (patient), weekly adherence (professional), pain and difficulty over time as a simple chart, outcome measures at set intervals.
- Flags to the professional: no activity for `INACTIVITY_NUDGE_DAYS`, repeated pain reports, sudden worsening.
- Plan changes create a new version, patient is notified, old versions are kept.
- Do not build the movement games now; leave an extension point (exercise type `GAME`) only.

## Phase 6: Documentation

- On End session, the note screen opens with the discipline template (SOAP style for physiotherapy) prefilled from intake and anything typed during the call.
- Autosave continuously (debounced, resilient to dropped connection, shows "Saved" state).
- Outcome measures captured as numbers (pain, function) so progress can be charted.
- Required before sign-off: assessment, plan, next step (follow-up, referral or discharge).
- Sign-off locks the note. Later changes are dated addenda; the original is never overwritten. Sign-off marks the booking complete and starts the release timer.
- Patient summary: plain-language version drafted from the note, edited and approved by the professional, then sent to the patient (link in email, not content).
- Every note read and write is audit logged.

## Phase 7: Referrals (extend the existing state machine)

- Refer tab in the room and also available after the session. Choose discipline, reason, urgency, optionally a specific professional, and which parts of the note to share.
- Patient consent prompt shows exactly what is shared and with whom. Nothing is shared without a yes. The patient can withdraw consent, which stops further sharing.
- Receiver gets an email and inbox item, opens a packet (reason, shared note, current plan, urgency), and accepts or declines. Decline requires a reason and returns the referral to the sender. No response in `REFERRAL_STALL_DAYS`: flag to sender and admin.
- On accept, the patient sees a booking screen for the receiver with the referral attached and first-visit price shown.
- After the visit, the receiver records their own note and plan (goal-and-task plan for OT and speech; device case with stages for prosthetics and orthotics) and sends a summary back. The sender confirms reading it and the referral closes.
- Patient sees "My care team": each professional with status (sent, accepted, booked, seen).
- No referral fees. No payment between professionals.

## Phase 8: After the consultation

- Book follow-up before leaving the room (optional), paid the normal way.
- Messaging between sessions (patient and professional), with a visible notice that it is not for emergencies and that replies are expected within `MESSAGE_REPLY_EXPECTED_HOURS`. Red-flag words in a patient message show the emergency advice to the patient.
- Daily plan reminders; reminders before every session.
- Inactivity nudge after `INACTIVITY_NUDGE_DAYS`. Worsening or red-flag report alerts the professional.
- Reassessment prompt at a professional-set interval (default every 2 to 4 weeks) repeating the outcome measures and comparing to the first visit.
- Discharge: professional writes a discharge summary; patient gets a copy and a maintenance plan.
- Feedback after discharge; ratings appear on the public profile only after `MIN_REVIEWS_TO_SHOW_RATING` reviews.
- Rebook the same professional in one tap; a new problem starts a new episode of care.

## Phase 9: Verification in a real browser

- Add Playwright E2E that drives the real UI (not just the API) through the whole journey: sign up → verify → intake → ranked list → book → pay (Paystack test) → join room → add exercises → sign note → refer to an OT → OT accepts → patient books OT → summary back → release and payout.
- Also test: RED triage blocks booking; slot race; expired hold; each refund case; stalled referral; consent withdrawn.
- Check every screen at 390px and 1280px widths. Fix any horizontal scroll, overlap, or contrast issue. Compare each built screen with its reference in `design/rehab360-design/reference/` and fix differences. Save screenshots to `docs/screenshots/`.
- Accessibility: visible focus, form labels, 44px touch targets, text contrast per BRAND.md.

## Final report (required)

Write `docs/CARE_FLOW_REPORT.md` and show it in your final message. It must contain:

1. Per phase: done, partial, or not done, with commit hashes.
2. Exact numbers: unit tests passing / total, E2E assertions passing / total, by file. Never write "all passing" without the numbers.
3. Which screens were browser-verified and which were not.
4. Every place you deviated from this prompt and why.
5. A list of things only Victor can do (accounts, keys, content review, decisions), each with the exact environment variable or step.
6. Known bugs and anything that looked wrong but you did not change.

If something is ambiguous, pick the safest option, record the choice in the report, and keep going. If something would require production access, real money, or a secret you do not have, stop that item and list it under Victor's tasks instead.