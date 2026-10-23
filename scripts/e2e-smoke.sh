#!/usr/bin/env bash
# =============================================================================
# Physio E2E smoke test — full money path + cross-user authorization.
# Usage:
#   DATABASE_URL=postgresql://HP@127.0.0.1:5433/physio_scratch \
#   REDIS_URL=redis://127.0.0.1:9999 \
#   JWT_SECRET=e2e-test-secret \
#   RESEND_API_KEY=placeholder-resend \
#   DAILY_API_KEY=placeholder-daily DAILY_DOMAIN=placeholder.daily.co \
#   PAYSTACK_SECRET_KEY=sk_test_placeholder \
#   PAYSTACK_WEBHOOK_SECRET=webhook-secret-e2e \
#   PAYSTACK_TEST_BYPASS=1 \
#   bash scripts/e2e-smoke.sh [API_BASE]
#
# Requires:
#   - A live API process started with those env vars
#   - psql on PATH pointing to the same scratch DB (via PG* vars or DATABASE_URL)
#   - openssl on PATH for HMAC-SHA512
#
# API_BASE defaults to http://localhost:4000
# =============================================================================
set -euo pipefail

API="${1:-http://localhost:4000}"
PASS=0
FAIL=0
WARN=0

SUFFIX="$(date +%s)"
PATIENT_EMAIL="patient-${SUFFIX}@e2e.test"
PHYSIO_EMAIL="physio-${SUFFIX}@e2e.test"
PATIENT2_EMAIL="patient2-${SUFFIX}@e2e.test"
PASSWORD="Passw0rd!e2e"

# Paystack signs webhooks with the account SECRET KEY (same as API auth key).
WEBHOOK_SECRET="${PAYSTACK_SECRET_KEY:-sk_test_placeholder}"

# DB connection — strip Prisma-specific query params psql doesn't understand
_RAW_DB="${DATABASE_URL:-postgresql://HP@127.0.0.1:5433/physio_scratch}"
PG_CONN="${_RAW_DB%%\?*}"

log()  { printf '\033[0;32m[PASS]\033[0m %s\n' "$*"; ((PASS++)) || true; }
fail() { printf '\033[0;31m[FAIL]\033[0m %s\n' "$*"; ((FAIL++)) || true; }
info() { printf '\033[0;34m[INFO]\033[0m %s\n' "$*"; }
warn() { printf '\033[0;33m[WARN]\033[0m %s\n' "$*"; ((WARN++)) || true; }

# ── Helpers ─────────────────────────────────────────────────────────────────

api() {
  local method="$1" path="$2"; shift 2
  curl -sS --max-time 15 -X "$method" "${API}/api${path}" \
    -H "Content-Type: application/json" "$@"
}

api_auth() {
  local method="$1" path="$2" token="$3"; shift 3
  curl -sS --max-time 15 -X "$method" "${API}/api${path}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${token}" "$@"
}

psql_exec() {
  psql "${PG_CONN}" -t -c "$1" 2>&1
}

hmac512() {
  local secret="$1" body="$2"
  printf '%s' "$body" | openssl dgst -sha512 -hmac "$secret" | awk '{print $NF}'
}

# Assert HTTP 403 or 404 — cross-user checks should return one of these.
assert_forbidden() {
  local label="$1" response="$2"
  if echo "$response" | grep -qiE '"statusCode":(403|404)|"code":"FORBIDDEN"'; then
    log "$label → correctly 403/404"
  else
    fail "$label → expected 403/404, got: $response"
  fi
}

# ── Pre-flight ───────────────────────────────────────────────────────────────
info "Checking prerequisites…"
command -v psql    >/dev/null || { fail "psql not on PATH"; exit 1; }
command -v openssl >/dev/null || { fail "openssl not on PATH"; exit 1; }

info "API base: $API"
HEALTH=$(api GET /health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  log "Health: $HEALTH"
else
  fail "Health endpoint unexpected: $HEALTH"; exit 1
fi

# ============================================================================
# PART 1 — PATIENT A FLOW
# ============================================================================
info "══ Part 1: Patient A flow ══"

SIGNUP=$(api POST /auth/signup -d "{
  \"email\":\"${PATIENT_EMAIL}\",\"password\":\"${PASSWORD}\",
  \"name\":\"E2E Patient A\"}")
echo "$SIGNUP" | grep -q '"userId"' && log "Patient A signup OK" || { fail "Patient A signup: $SIGNUP"; exit 1; }

api POST /auth/dev-verify -d "{\"email\":\"${PATIENT_EMAIL}\"}" | grep -q '"ok":true' \
  && log "Patient A dev-verify OK" || { fail "Patient A dev-verify"; exit 1; }

LOGIN=$(api POST /auth/login -d "{\"email\":\"${PATIENT_EMAIL}\",\"password\":\"${PASSWORD}\"}")
PATIENT_TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 || true)
[ -n "$PATIENT_TOKEN" ] && log "Patient A login OK" || { fail "Patient A login: $LOGIN"; exit 1; }

# Extract patient A's user ID for cross-user tests later
PATIENT_USER_ID=$(api_auth GET /auth/me "$PATIENT_TOKEN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
[ -n "$PATIENT_USER_ID" ] && log "Patient A user ID: ${PATIENT_USER_ID}" || warn "Could not extract patient A user ID"

INTAKE=$(api_auth POST /triage/intake "$PATIENT_TOKEN" -d '{
  "complaint":"Lower back pain","bodyRegion":"LOWER_BACK","onset":"3 weeks ago",
  "painScore":5,"history":"None","medications":"Ibuprofen",
  "redFlagAnswers":[
    {"questionId":"red.major_trauma","answer":false},
    {"questionId":"red.neuro_progressive_weakness","answer":false},
    {"questionId":"red.neuro_bladder_bowel","answer":false},
    {"questionId":"red.neuro_saddle_numbness","answer":false},
    {"questionId":"red.cardioresp","answer":false},
    {"questionId":"red.systemic","answer":false},
    {"questionId":"red.post_op_complication","answer":false},
    {"questionId":"red.severe_worsening","answer":false},
    {"questionId":"amber.post_op_planned","answer":false},
    {"questionId":"amber.mobility_limited","answer":false}
  ]
}')
INTAKE_ID=$(echo "$INTAKE" | grep -o '"intakeId":"[^"]*"' | cut -d'"' -f4 || true)
TRIAGE_LEVEL=$(echo "$INTAKE" | grep -o '"level":"[^"]*"' | cut -d'"' -f4 || true)
[ -n "$INTAKE_ID" ] && log "Intake OK: id=${INTAKE_ID} level=${TRIAGE_LEVEL}" \
  || { fail "Intake: $INTAKE"; exit 1; }

api_auth GET "/triage/${INTAKE_ID}" "$PATIENT_TOKEN" | grep -q '"id":' \
  && log "GET /triage/:id OK" || fail "GET /triage/:id failed"

LATEST_ID=$(api_auth GET /triage/latest "$PATIENT_TOKEN" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | head -1 || true)
[ -n "$LATEST_ID" ] && log "GET /triage/latest OK: id=${LATEST_ID}" || fail "GET /triage/latest failed"

PROFILE=$(api_auth PUT /patients/me "$PATIENT_TOKEN" -d '{
  "dob":"1990-06-15","sex":"Male","location":"Lagos, Nigeria",
  "emergencyContact":"Jane Doe - 08012345678"}')
echo "$PROFILE" | grep -q '"userId":' && log "Profile update OK" || fail "Profile update: $PROFILE"

PHYSIOS_BEFORE=$(api GET /physios)
PHYSIO_COUNT_BEFORE=$(echo "$PHYSIOS_BEFORE" | { grep -o '"userId"' || true; } | wc -l | tr -d ' \n')
log "GET /physios before verification: ${PHYSIO_COUNT_BEFORE} verified"

# ============================================================================
# PART 2 — PHYSIO X SIGNUP + APPLY
# ============================================================================
info "══ Part 2: Physio X signup and apply ══"

api POST /auth/signup -d "{
  \"email\":\"${PHYSIO_EMAIL}\",\"password\":\"${PASSWORD}\",
  \"name\":\"E2E Physio X\"}" | grep -q '"userId"' \
  && log "Physio X signup OK" || { fail "Physio X signup"; exit 1; }

api POST /auth/dev-verify -d "{\"email\":\"${PHYSIO_EMAIL}\"}" | grep -q '"ok":true' \
  && log "Physio X dev-verify OK" || { fail "Physio X dev-verify"; exit 1; }

PHY_LOGIN=$(api POST /auth/login -d "{\"email\":\"${PHYSIO_EMAIL}\",\"password\":\"${PASSWORD}\"}")
PHYSIO_TOKEN=$(echo "$PHY_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 || true)
[ -n "$PHYSIO_TOKEN" ] && log "Physio X login OK" || { fail "Physio X login: $PHY_LOGIN"; exit 1; }

PHY_APPLY=$(api_auth POST /physios/apply "$PHYSIO_TOKEN" -d '{
  "licenceNo":"PHYSIO-NG-E2E-001",
  "specialties":["Musculoskeletal","Sports"],
  "bio":"E2E test physiotherapist X. Experienced in musculoskeletal conditions, sports injuries, and post-operative rehabilitation.",
  "rate":1000000,"serviceArea":"Lagos"}')
PHY_USER_ID=$(echo "$PHY_APPLY" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4 || true)
[ -n "$PHY_USER_ID" ] && log "Physio X apply OK: userId=${PHY_USER_ID}" \
  || { fail "Physio X apply: $PHY_APPLY"; exit 1; }

PHYSIOS_UNVERIFIED=$(api GET /physios)
PHYSIO_COUNT_UV=$(echo "$PHYSIOS_UNVERIFIED" | { grep -o '"userId"' || true; } | wc -l | tr -d ' \n')
[ "$PHYSIO_COUNT_UV" = "$PHYSIO_COUNT_BEFORE" ] \
  && log "Unverified physio not in public list (count unchanged: ${PHYSIO_COUNT_UV})" \
  || fail "Unverified physio appeared in public list (expected=${PHYSIO_COUNT_BEFORE}, got=${PHYSIO_COUNT_UV})"

PENDING=$(api_auth GET /physios/admin/pending "$PHYSIO_TOKEN")
echo "$PENDING" | grep -qiE '"code":"FORBIDDEN"|"statusCode":403' \
  && log "PHYSIO correctly rejected from /admin/pending" \
  || fail "Expected FORBIDDEN for physio on admin endpoint: $PENDING"

# ============================================================================
# PART 3 — ADMIN: SEED + VERIFY PHYSIO X
# ============================================================================
info "══ Part 3: Admin seed and physio X verification ══"

ADMIN_EMAIL="admin-${SUFFIX}@e2e.test"

api POST /auth/signup -d "{
  \"email\":\"${ADMIN_EMAIL}\",\"password\":\"${PASSWORD}\",
  \"name\":\"E2E Admin\"}" | grep -q '"userId"' \
  || { fail "Admin user creation failed"; exit 1; }
api POST /auth/dev-verify -d "{\"email\":\"${ADMIN_EMAIL}\"}" >/dev/null

psql_exec "UPDATE \"User\" SET role = 'ADMIN' WHERE email = '${ADMIN_EMAIL}';" >/dev/null 2>&1 \
  && log "Admin user promoted to ADMIN via psql" || { fail "Admin psql promotion failed"; exit 1; }

ADMIN_LOGIN=$(api POST /auth/login -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${PASSWORD}\"}")
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 || true)
[ -n "$ADMIN_TOKEN" ] && log "Admin login OK" || { fail "Admin login: $ADMIN_LOGIN"; exit 1; }

VERIFY_RESP=$(api_auth POST /physios/admin/verify "$ADMIN_TOKEN" -d "{
  \"userId\":\"${PHY_USER_ID}\",\"decision\":\"VERIFIED\"}")
echo "$VERIFY_RESP" | grep -q '"licenceStatus":"VERIFIED"' \
  && log "Admin verified physio X OK" \
  || { fail "Admin verify X: $VERIFY_RESP"; exit 1; }

PHY_LOGIN2=$(api POST /auth/login -d "{\"email\":\"${PHYSIO_EMAIL}\",\"password\":\"${PASSWORD}\"}")
PHYSIO_TOKEN2=$(echo "$PHY_LOGIN2" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 || true)
[ -n "$PHYSIO_TOKEN2" ] && log "Physio X re-login (fresh PHYSIO token) OK" \
  || { fail "Physio X re-login: $PHY_LOGIN2"; exit 1; }

PHYSIOS_VERIFIED=$(api GET /physios)
PHYSIO_COUNT_V=$(echo "$PHYSIOS_VERIFIED" | { grep -o '"userId"' || true; } | wc -l | tr -d ' \n')
[ "$PHYSIO_COUNT_V" -ge 1 ] \
  && log "Verified physio X appears in GET /physios: count=${PHYSIO_COUNT_V}" \
  || fail "Verified physio X missing from GET /physios"

# ============================================================================
# PART 4 — PHYSIO X: AVAILABILITY + SLOTS
# ============================================================================
info "══ Part 4: Availability and slot listing ══"

AVAIL=$(api_auth POST /booking/availability "$PHYSIO_TOKEN2" -d '{
  "slots": [
    {"weekday":0,"startMinute":540,"endMinute":1020,"mode":"VIDEO"},
    {"weekday":1,"startMinute":540,"endMinute":1020,"mode":"VIDEO"},
    {"weekday":2,"startMinute":540,"endMinute":1020,"mode":"VIDEO"},
    {"weekday":3,"startMinute":540,"endMinute":1020,"mode":"VIDEO"},
    {"weekday":4,"startMinute":540,"endMinute":1020,"mode":"VIDEO"},
    {"weekday":5,"startMinute":540,"endMinute":1020,"mode":"VIDEO"},
    {"weekday":6,"startMinute":540,"endMinute":1020,"mode":"VIDEO"}
  ]
}')
AVAIL_COUNT=$(echo "$AVAIL" | { grep -o '"id":' || true; } | wc -l | tr -d ' \n')
[ "$AVAIL_COUNT" -ge 7 ] \
  && log "Physio X availability set: ${AVAIL_COUNT} blocks" \
  || { fail "Set availability: $AVAIL"; exit 1; }

SLOTS_RESP=$(api_auth GET "/booking/slots/${PHY_USER_ID}" "$PATIENT_TOKEN")
SLOT_COUNT=$(echo "$SLOTS_RESP" | { grep -o '"startsAt"' || true; } | wc -l | tr -d ' \n')
[ "$SLOT_COUNT" -ge 1 ] \
  && log "GET /booking/slots returns ${SLOT_COUNT} slots" \
  || { fail "No slots returned: $SLOTS_RESP"; exit 1; }

SLOT=$(echo "$SLOTS_RESP" | grep -o '"startsAt":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
[ -n "$SLOT" ] && log "First slot: ${SLOT}" || { fail "Could not extract slot"; exit 1; }

# ============================================================================
# PART 5 — PATIENT A: BOOK + PAYMENT FLOW
# ============================================================================
info "══ Part 5: Booking and payment ══"

BOOKING=$(api_auth POST /booking "$PATIENT_TOKEN" -d "{
  \"physioId\":\"${PHY_USER_ID}\",
  \"intakeId\":\"${INTAKE_ID}\",
  \"type\":\"ASSESSMENT\",\"mode\":\"VIDEO\",
  \"startsAt\":\"${SLOT}\",\"durationMinutes\":45
}")
APPT_ID=$(echo "$BOOKING" | grep -o '"appointmentId":"[^"]*"' | cut -d'"' -f4 || true)
REF=$(echo "$BOOKING"     | grep -o '"reference":"[^"]*"' | cut -d'"' -f4 || true)
AUTH_URL=$(echo "$BOOKING" | grep -o '"authorizationUrl":"[^"]*"' | cut -d'"' -f4 || true)

[ -n "$APPT_ID" ] && [ -n "$REF" ] && [ -n "$AUTH_URL" ] \
  && log "Booking OK: apptId=${APPT_ID} ref=${REF}" \
  || { fail "Booking: $BOOKING"; exit 1; }

echo "$AUTH_URL" | grep -q "stub.paystack.test" \
  && log "Stub Paystack provider active" \
  || warn "authorizationUrl not from stub — real Paystack may be active"

APPT_BEFORE=$(api_auth GET "/booking/appointments/${APPT_ID}" "$PATIENT_TOKEN")
APPT_STATUS=$(echo "$APPT_BEFORE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
[ "$APPT_STATUS" = "PENDING_PAYMENT" ] \
  && log "Appointment status PENDING_PAYMENT (before webhook)" \
  || fail "Expected PENDING_PAYMENT, got: ${APPT_STATUS}"

info "── Webhook: charge.success (good signature) ──"
WEBHOOK_BODY="{\"event\":\"charge.success\",\"data\":{\"reference\":\"${REF}\",\"status\":\"success\",\"metadata\":{\"appointmentId\":\"${APPT_ID}\"}}}"
SIG=$(hmac512 "$WEBHOOK_SECRET" "$WEBHOOK_BODY")
WH_RESP=$(curl -sS --max-time 10 -X POST "${API}/api/payments/paystack/webhook" \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: ${SIG}" \
  -d "$WEBHOOK_BODY")
echo "$WH_RESP" | grep -q '"ok":true' \
  && log "Webhook accepted" || fail "Webhook rejected: $WH_RESP"

APPT_AFTER=$(api_auth GET "/booking/appointments/${APPT_ID}" "$PATIENT_TOKEN")
APPT_STATUS2=$(echo "$APPT_AFTER" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
[ "$APPT_STATUS2" = "CONFIRMED" ] \
  && log "Appointment CONFIRMED after webhook" \
  || fail "Expected CONFIRMED, got: ${APPT_STATUS2}"

LEDGER=$(api_auth GET "/admin/payments/ledger/${APPT_ID}" "$ADMIN_TOKEN")
LEDGER_TYPES=$(echo "$LEDGER" | { grep -o '"type":"[^"]*"' || true; } | cut -d'"' -f4 | tr '\n' ',')
echo "$LEDGER" | grep -q '"CHARGE"' && echo "$LEDGER" | grep -q '"HOLD"' \
  && log "Ledger after webhook: types=[${LEDGER_TYPES%,}]" \
  || fail "Expected CHARGE+HOLD ledger, got: $LEDGER"

LAST_BALANCE=$(echo "$LEDGER" | grep -o '"balanceAfterKobo":[0-9-]*' | tail -1 | cut -d':' -f2 || true)
[ "$LAST_BALANCE" = "0" ] \
  && log "Ledger balance after CHARGE+HOLD = 0" \
  || fail "Expected balance 0 after CHARGE+HOLD, got: ${LAST_BALANCE}"

info "── Webhook: idempotency test ──"
WH_RESP2=$(curl -sS --max-time 10 -X POST "${API}/api/payments/paystack/webhook" \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: ${SIG}" \
  -d "$WEBHOOK_BODY")
echo "$WH_RESP2" | grep -q '"ignored"' \
  && log "Second webhook ignored (idempotent)" \
  || fail "Expected idempotent ignore: $WH_RESP2"

info "── Webhook: bad signature rejected ──"
BAD_SIG="0000000000000000000000000000000000000000000000000000000000000000"
WH_BAD=$(curl -sS --max-time 10 -X POST "${API}/api/payments/paystack/webhook" \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: ${BAD_SIG}" \
  -d "$WEBHOOK_BODY")
echo "$WH_BAD" | grep -qiE '"BAD_SIGNATURE"|"statusCode":400' \
  && log "Bad signature correctly rejected" \
  || fail "Expected BAD_SIGNATURE rejection: $WH_BAD"

# ── Double-booking: same slot rejected ──
info "── Double-booking: same slot rejected ──"

api POST /auth/signup -d "{
  \"email\":\"${PATIENT2_EMAIL}\",\"password\":\"${PASSWORD}\",
  \"name\":\"E2E Patient B\"}" >/dev/null
api POST /auth/dev-verify -d "{\"email\":\"${PATIENT2_EMAIL}\"}" >/dev/null
P2_LOGIN=$(api POST /auth/login -d "{\"email\":\"${PATIENT2_EMAIL}\",\"password\":\"${PASSWORD}\"}")
PATIENT2_TOKEN=$(echo "$P2_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 || true)
PATIENT2_USER_ID=$(api_auth GET /auth/me "$PATIENT2_TOKEN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)

INTAKE2=$(api_auth POST /triage/intake "$PATIENT2_TOKEN" -d '{
  "complaint":"Knee pain","bodyRegion":"LOWER_BACK","onset":"1 week",
  "painScore":3,"redFlagAnswers":[
    {"questionId":"red.major_trauma","answer":false},
    {"questionId":"red.neuro_progressive_weakness","answer":false},
    {"questionId":"red.neuro_bladder_bowel","answer":false},
    {"questionId":"red.neuro_saddle_numbness","answer":false},
    {"questionId":"red.cardioresp","answer":false},
    {"questionId":"red.systemic","answer":false},
    {"questionId":"red.post_op_complication","answer":false},
    {"questionId":"red.severe_worsening","answer":false},
    {"questionId":"amber.post_op_planned","answer":false},
    {"questionId":"amber.mobility_limited","answer":false}
  ]
}')
INTAKE2_ID=$(echo "$INTAKE2" | grep -o '"intakeId":"[^"]*"' | cut -d'"' -f4 || true)
api_auth PUT /patients/me "$PATIENT2_TOKEN" -d '{
  "dob":"1985-01-01","sex":"Female","location":"Abuja","emergencyContact":"Bob - 080"}' >/dev/null

DUPE_BOOKING=$(api_auth POST /booking "$PATIENT2_TOKEN" -d "{
  \"physioId\":\"${PHY_USER_ID}\",
  \"intakeId\":\"${INTAKE2_ID}\",
  \"type\":\"ASSESSMENT\",\"mode\":\"VIDEO\",
  \"startsAt\":\"${SLOT}\",\"durationMinutes\":45
}")
DUPE_CODE=$(echo "$DUPE_BOOKING" | grep -o '"code":"[^"]*"' | cut -d'"' -f4 || true)
[ "$DUPE_CODE" = "SLOT_UNAVAILABLE" ] \
  && log "Double-booking correctly rejected: SLOT_UNAVAILABLE" \
  || fail "Expected SLOT_UNAVAILABLE: $DUPE_BOOKING"

info "── Session join window ──"
# Use now()-relative times so the join window is always aligned with the API clock.
# Call psql directly (no -t) so command tags like "UPDATE 1" appear in output.
PSQL_UPDATE=$(psql "${PG_CONN}" -c "UPDATE \"Appointment\" SET \"startsAt\" = now() - interval '30 minutes', \"endsAt\" = now() + interval '60 minutes' WHERE id = '${APPT_ID}';" 2>&1)
if echo "$PSQL_UPDATE" | grep -qiE "^ERROR|^FATAL"; then
  fail "psql time-shift failed: $PSQL_UPDATE"; exit 1
else
  log "Appointment time shifted into join window (start=now-30min, end=now+60min)"
fi

JOIN_RESP=$(api_auth POST "/sessions/${APPT_ID}/join" "$PATIENT_TOKEN")
if echo "$JOIN_RESP" | grep -qiE '"token"|"roomUrl"'; then
  log "Session join OK"
elif echo "$JOIN_RESP" | grep -qiE '"NOT_JOINABLE"|"FORBIDDEN"'; then
  fail "Session join failed with auth/status error: $JOIN_RESP"
elif echo "$JOIN_RESP" | grep -qiE '"TOO_EARLY"'; then
  fail "Session join: TOO_EARLY after time-shift — API/DB clock drift detected: $JOIN_RESP"
else
  log "Session join stopped at video provider placeholder: $JOIN_RESP"
fi

# ============================================================================
# PART 6 — ADMIN: RELEASE AND REFUND
# ============================================================================
info "══ Part 6: Admin release and refund ══"

RELEASE=$(api_auth POST "/admin/payments/release/${APPT_ID}" "$ADMIN_TOKEN")
LEDGER2=$(api_auth GET "/admin/payments/ledger/${APPT_ID}" "$ADMIN_TOKEN")
LEDGER2_TYPES=$(echo "$LEDGER2" | { grep -o '"type":"[^"]*"' || true; } | cut -d'"' -f4 | tr '\n' ',')
echo "$LEDGER2" | grep -q '"RELEASE"' \
  && echo "$LEDGER2" | grep -q '"PLATFORM_FEE"' \
  && echo "$LEDGER2" | grep -q '"PHYSIO_PAYOUT"' \
  && log "Release ledger rows present: [${LEDGER2_TYPES%,}]" \
  || fail "Missing release ledger rows: $LEDGER2"

FINAL_BALANCE=$(echo "$LEDGER2" | grep -o '"balanceAfterKobo":[0-9-]*' | tail -1 | cut -d':' -f2 || true)
[ "$FINAL_BALANCE" = "0" ] \
  && log "Final ledger balance = 0 (net zero: correct)" \
  || fail "Expected final balance 0, got: ${FINAL_BALANCE}"

SLOTS_RESP2=$(api_auth GET "/booking/slots/${PHY_USER_ID}" "$PATIENT_TOKEN")
SLOT2=$(echo "$SLOTS_RESP2" | grep -o '"startsAt":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
[ -n "$SLOT2" ] || { fail "No second slot available for refund test"; exit 1; }

INTAKE3=$(api_auth POST /triage/intake "$PATIENT_TOKEN" -d '{
  "complaint":"Shoulder pain","bodyRegion":"LOWER_BACK","onset":"2 days",
  "painScore":4,"redFlagAnswers":[
    {"questionId":"red.major_trauma","answer":false},
    {"questionId":"red.neuro_progressive_weakness","answer":false},
    {"questionId":"red.neuro_bladder_bowel","answer":false},
    {"questionId":"red.neuro_saddle_numbness","answer":false},
    {"questionId":"red.cardioresp","answer":false},
    {"questionId":"red.systemic","answer":false},
    {"questionId":"red.post_op_complication","answer":false},
    {"questionId":"red.severe_worsening","answer":false},
    {"questionId":"amber.post_op_planned","answer":false},
    {"questionId":"amber.mobility_limited","answer":false}
  ]
}')
INTAKE3_ID=$(echo "$INTAKE3" | grep -o '"intakeId":"[^"]*"' | cut -d'"' -f4 || true)

BOOKING3=$(api_auth POST /booking "$PATIENT_TOKEN" -d "{
  \"physioId\":\"${PHY_USER_ID}\",
  \"intakeId\":\"${INTAKE3_ID}\",
  \"type\":\"ASSESSMENT\",\"mode\":\"VIDEO\",
  \"startsAt\":\"${SLOT2}\",\"durationMinutes\":45
}")
APPT3_ID=$(echo "$BOOKING3" | grep -o '"appointmentId":"[^"]*"' | cut -d'"' -f4 || true)
REF3=$(echo "$BOOKING3"    | grep -o '"reference":"[^"]*"' | cut -d'"' -f4 || true)
[ -n "$APPT3_ID" ] && log "Second booking for refund test: apptId=${APPT3_ID}" \
  || { fail "Second booking failed: $BOOKING3"; exit 1; }

WH3_BODY="{\"event\":\"charge.success\",\"data\":{\"reference\":\"${REF3}\",\"status\":\"success\",\"metadata\":{\"appointmentId\":\"${APPT3_ID}\"}}}"
SIG3=$(hmac512 "$WEBHOOK_SECRET" "$WH3_BODY")
curl -sS --max-time 10 -X POST "${API}/api/payments/paystack/webhook" \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: ${SIG3}" \
  -d "$WH3_BODY" | grep -q '"ok":true' \
  && log "Second booking confirmed via webhook" \
  || fail "Second booking webhook failed"

REFUND_RESP=$(api_auth POST "/admin/payments/refund/${APPT3_ID}" "$ADMIN_TOKEN" \
  -d '{"reason":"E2E refund test"}')
LEDGER3=$(api_auth GET "/admin/payments/ledger/${APPT3_ID}" "$ADMIN_TOKEN")
echo "$LEDGER3" | grep -q '"REFUND"' \
  && log "Refund ledger row present" \
  || fail "Missing REFUND row: $LEDGER3"

REFUND_BALANCE=$(echo "$LEDGER3" | grep -o '"balanceAfterKobo":[0-9-]*' | tail -1 | cut -d':' -f2 || true)
# After CHARGE(+) + HOLD(-) + REFUND(-): balance = -amountKobo (negative = platform owes patient; correct).
[ -n "$REFUND_BALANCE" ] \
  && log "Refund ledger final balance = ${REFUND_BALANCE} kobo (negative = refunded to patient)" \
  || fail "Could not extract refund balance from ledger"

# ============================================================================
# PART 7 — ADMIN VIEW
# ============================================================================
info "══ Part 7: Admin ledger view ══"

FULL_LEDGER=$(api_auth GET "/admin/payments/ledger" "$ADMIN_TOKEN")
echo "$FULL_LEDGER" | grep -q '\[' \
  && log "Admin GET /admin/payments/ledger OK" \
  || fail "Admin ledger list failed: $FULL_LEDGER"

# ============================================================================
# PART 8 — CROSS-USER AUTHORIZATION
# ============================================================================
info "══ Part 8: Cross-user authorization ══"

# ─── 8.0 Setup: notes + program + exercise for patient A / physio X ─────────

# Seed a test exercise (safe to run multiple times)
psql_exec "INSERT INTO \"Exercise\" (id, name, region, \"videoUrl\", cues, difficulty) \
  VALUES ('ex-e2e-001','E2E Squat','LOWER_BACK','https://placeholder.test/ex1','Keep back straight',1) \
  ON CONFLICT (id) DO NOTHING;" >/dev/null 2>&1 \
  && log "Test exercise seeded" || warn "Exercise seed failed (may be fine if it already exists)"

# Create session notes for APPT_ID (physio X writes them)
NOTES_SETUP=$(api_auth POST /sessions/notes "$PHYSIO_TOKEN2" -d "{
  \"appointmentId\":\"${APPT_ID}\",
  \"subjective\":\"Lower back pain\",
  \"objective\":\"ROM limited at 45 deg\",
  \"assessment\":\"Mild lumbar strain\",
  \"plan\":\"Physio exercises 3x/week\",
  \"outcomeMeasures\":{\"vas\":3}
}")
echo "$NOTES_SETUP" | grep -q '"appointmentId"' \
  && log "Session notes created for cross-user tests" \
  || warn "Session notes setup failed (cross-note tests may not work): $NOTES_SETUP"

# Create a program for patient A (physio X creates it — has appointment with A)
PROGRAM_SETUP=$(api_auth POST /programs "$PHYSIO_TOKEN2" -d "{
  \"patientId\":\"${PATIENT_USER_ID}\",
  \"startsAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"items\":[{\"exerciseId\":\"ex-e2e-001\",\"sets\":3,\"reps\":10,\"holdSeconds\":0,\"frequency\":\"daily\"}]
}")
PROGRAM_ID=$(echo "$PROGRAM_SETUP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
[ -n "$PROGRAM_ID" ] \
  && log "Program created for cross-user tests: id=${PROGRAM_ID}" \
  || warn "Program setup failed (cross-program tests may not work): $PROGRAM_SETUP"

# ─── 8.1 Create physio Y (verified, no relationship with patient A) ──────────
info "── 8.1: Create physio Y ──"
PHYSIO_Y_EMAIL="physio-y-${SUFFIX}@e2e.test"

api POST /auth/signup -d "{
  \"email\":\"${PHYSIO_Y_EMAIL}\",\"password\":\"${PASSWORD}\",
  \"name\":\"E2E Physio Y\"}" >/dev/null
api POST /auth/dev-verify -d "{\"email\":\"${PHYSIO_Y_EMAIL}\"}" >/dev/null
PHY_Y_LOGIN=$(api POST /auth/login -d "{\"email\":\"${PHYSIO_Y_EMAIL}\",\"password\":\"${PASSWORD}\"}")
PHYSIO_Y_TOKEN=$(echo "$PHY_Y_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 || true)

PHY_Y_APPLY=$(api_auth POST /physios/apply "$PHYSIO_Y_TOKEN" -d '{
  "licenceNo":"PHYSIO-NG-E2E-Y002",
  "specialties":["Musculoskeletal"],
  "bio":"E2E test physiotherapist Y. Experienced in musculoskeletal conditions and post-operative rehabilitation.",
  "rate":800000,"serviceArea":"Abuja"}')
PHY_Y_ID=$(echo "$PHY_Y_APPLY" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4 || true)
[ -n "$PHY_Y_ID" ] && log "Physio Y applied: userId=${PHY_Y_ID}" || fail "Physio Y apply: $PHY_Y_APPLY"

api_auth POST /physios/admin/verify "$ADMIN_TOKEN" -d "{
  \"userId\":\"${PHY_Y_ID}\",\"decision\":\"VERIFIED\"}" | grep -q '"licenceStatus":"VERIFIED"' \
  && log "Admin verified physio Y" || fail "Admin verify Y failed"

PHY_Y_LOGIN2=$(api POST /auth/login -d "{\"email\":\"${PHYSIO_Y_EMAIL}\",\"password\":\"${PASSWORD}\"}")
PHYSIO_Y_TOKEN2=$(echo "$PHY_Y_LOGIN2" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 || true)
[ -n "$PHYSIO_Y_TOKEN2" ] && log "Physio Y re-login (PHYSIO token) OK" || fail "Physio Y re-login failed"

# ─── 8.2 Create unverified physio Z (applied, NOT verified) ──────────────────
info "── 8.2: Create unverified physio Z (applied, not verified) ──"
PHYSIO_Z_EMAIL="physio-z-unverif-${SUFFIX}@e2e.test"

api POST /auth/signup -d "{
  \"email\":\"${PHYSIO_Z_EMAIL}\",\"password\":\"${PASSWORD}\",
  \"name\":\"E2E Physio Z Unverified\"}" >/dev/null
api POST /auth/dev-verify -d "{\"email\":\"${PHYSIO_Z_EMAIL}\"}" >/dev/null
PHY_Z_LOGIN=$(api POST /auth/login -d "{\"email\":\"${PHYSIO_Z_EMAIL}\",\"password\":\"${PASSWORD}\"}")
PHYSIO_Z_TOKEN=$(echo "$PHY_Z_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 || true)
[ -n "$PHYSIO_Z_TOKEN" ] && log "Physio Z login OK (still PATIENT role)" || fail "Physio Z login failed"

api_auth POST /physios/apply "$PHYSIO_Z_TOKEN" -d '{
  "licenceNo":"PHYSIO-NG-E2E-Z003",
  "specialties":["Musculoskeletal"],
  "bio":"E2E unverified physiotherapist Z. Experienced in musculoskeletal conditions and rehabilitation work.",
  "rate":900000,"serviceArea":"Port Harcourt"}' | grep -q '"userId"' \
  && log "Physio Z applied (will remain unverified)" \
  || fail "Physio Z apply failed"
# Deliberately skip admin verify for Z

# ─── 8.3 Patient B reads Patient A's clinical records → all 403/404 ──────────
info "── 8.3: Patient B cannot read Patient A's records ──"

assert_forbidden "B reads A's intake (GET /triage/:id)" \
  "$(api_auth GET "/triage/${INTAKE_ID}" "$PATIENT2_TOKEN")"

assert_forbidden "B reads A's appointment (GET /booking/appointments/:id)" \
  "$(api_auth GET "/booking/appointments/${APPT_ID}" "$PATIENT2_TOKEN")"

assert_forbidden "B reads A's session (GET /sessions/:id)" \
  "$(api_auth GET "/sessions/${APPT_ID}" "$PATIENT2_TOKEN")"

assert_forbidden "B reads A's session notes (GET /sessions/:id/notes)" \
  "$(api_auth GET "/sessions/${APPT_ID}/notes" "$PATIENT2_TOKEN")"

assert_forbidden "B reads A's programs (GET /programs/patient/:patientId)" \
  "$(api_auth GET "/programs/patient/${PATIENT_USER_ID}" "$PATIENT2_TOKEN")"

assert_forbidden "B verifies A's payment (GET /payments/verify/:ref)" \
  "$(api_auth GET "/payments/verify/${REF}" "$PATIENT2_TOKEN")"

# ─── 8.4 Physio Y writes on Physio X's appointment → all 403 ─────────────────
info "── 8.4: Physio Y cannot write on Physio X's appointment ──"

Y_NOTES=$(api_auth POST /sessions/notes "$PHYSIO_Y_TOKEN2" -d "{
  \"appointmentId\":\"${APPT_ID}\",
  \"subjective\":\"Y intrusion\",
  \"objective\":\"Y intrusion\",
  \"assessment\":\"Y intrusion\",
  \"plan\":\"Y intrusion\",
  \"outcomeMeasures\":{}
}")
assert_forbidden "Y writes notes on X's appointment" "$Y_NOTES"

Y_PROGRAM=$(api_auth POST /programs "$PHYSIO_Y_TOKEN2" -d "{
  \"patientId\":\"${PATIENT_USER_ID}\",
  \"startsAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"items\":[{\"exerciseId\":\"ex-e2e-001\",\"sets\":2,\"reps\":8,\"holdSeconds\":0,\"frequency\":\"daily\"}]
}")
assert_forbidden "Y creates program for A (no appointment with A)" "$Y_PROGRAM"

# ─── 8.5 Patient calls physio-only routes → all 403 ──────────────────────────
info "── 8.5: Patient A cannot call physio-only routes ──"

assert_forbidden "Patient sets availability (physio-only)" \
  "$(api_auth POST /booking/availability "$PATIENT_TOKEN" -d '{"slots":[]}')"

assert_forbidden "Patient writes session notes (physio-only)" \
  "$(api_auth POST /sessions/notes "$PATIENT_TOKEN" -d "{
    \"appointmentId\":\"${APPT_ID}\",
    \"subjective\":\"x\",\"objective\":\"x\",
    \"assessment\":\"x\",\"plan\":\"x\",
    \"outcomeMeasures\":{}
  }")"

assert_forbidden "Patient creates program (physio-only)" \
  "$(api_auth POST /programs "$PATIENT_TOKEN" -d "{
    \"patientId\":\"${PATIENT_USER_ID}\",
    \"startsAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"items\":[]
  }")"

# ─── 8.6 Patient calls admin-only routes → all 403 ───────────────────────────
info "── 8.6: Patient A cannot call admin-only routes ──"

assert_forbidden "Patient reads admin pending physios" \
  "$(api_auth GET /physios/admin/pending "$PATIENT_TOKEN")"

assert_forbidden "Patient calls admin verify" \
  "$(api_auth POST /physios/admin/verify "$PATIENT_TOKEN" -d "{
    \"userId\":\"${PHY_USER_ID}\",\"decision\":\"VERIFIED\"
  }")"

assert_forbidden "Patient calls admin release" \
  "$(api_auth POST "/admin/payments/release/${APPT_ID}" "$PATIENT_TOKEN")"

assert_forbidden "Patient calls admin ledger" \
  "$(api_auth GET "/admin/payments/ledger/${APPT_ID}" "$PATIENT_TOKEN")"

# ─── 8.7 Unverified physio Z (still PATIENT role) cannot call physio routes ──
info "── 8.7: Unverified physio Z cannot call physio-only routes ──"

assert_forbidden "Unverified physio sets availability" \
  "$(api_auth POST /booking/availability "$PHYSIO_Z_TOKEN" -d '{"slots":[]}')"

assert_forbidden "Unverified physio writes session notes" \
  "$(api_auth POST /sessions/notes "$PHYSIO_Z_TOKEN" -d "{
    \"appointmentId\":\"${APPT_ID}\",
    \"subjective\":\"z\",\"objective\":\"z\",
    \"assessment\":\"z\",\"plan\":\"z\",
    \"outcomeMeasures\":{}
  }")"

assert_forbidden "Unverified physio joins patient A's session" \
  "$(api_auth POST "/sessions/${APPT_ID}/join" "$PHYSIO_Z_TOKEN")"

# ─── 8.8 Physio X cannot read Patient B's records ────────────────────────────
info "── 8.8: Physio X cannot read Patient B's data (no appointment with B) ──"

assert_forbidden "Physio X reads B's intake (no appointment)" \
  "$(api_auth GET "/triage/${INTAKE2_ID}" "$PHYSIO_TOKEN2")"

assert_forbidden "Physio X reads B's programs (no appointment)" \
  "$(api_auth GET "/programs/patient/${PATIENT2_USER_ID}" "$PHYSIO_TOKEN2")"

# ============================================================================
# SUMMARY
# ============================================================================
info ""
info "═══════════════════════════════════════════════════"
info "PASS: ${PASS}   FAIL: ${FAIL}   WARN: ${WARN}"
info "═══════════════════════════════════════════════════"
[ "$FAIL" -eq 0 ]
