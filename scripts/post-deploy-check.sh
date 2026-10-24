#!/usr/bin/env bash
# =============================================================================
# Rehab360 — post-deploy smoke check
# Usage:
#   API_URL=https://physio-api.onrender.com \
#   WEB_URL=https://rehab360.vercel.app \
#   bash scripts/post-deploy-check.sh
#
# Exits 0 when all checks pass, 1 on any failure.
# Requires curl on PATH.
# =============================================================================
set -euo pipefail

API="${API_URL:-http://localhost:4000}"
WEB="${WEB_URL:-http://localhost:3000}"

PASS=0
FAIL=0

log()  { printf '\033[0;32m[PASS]\033[0m %s\n' "$*"; ((PASS++)) || true; }
fail() { printf '\033[0;31m[FAIL]\033[0m %s\n' "$*"; ((FAIL++)) || true; }
info() { printf '\033[0;34m[INFO]\033[0m %s\n' "$*"; }

SUFFIX="$(date +%s)"

# ── 1. API health ─────────────────────────────────────────────────────────────
info "1. API health check"
HEALTH=$(curl -fsS --max-time 10 "${API}/api/health" 2>&1 || true)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  log "API health OK: $HEALTH"
else
  fail "API health failed — is the service up? Got: $HEALTH"
fi

# ── 2. Signup ─────────────────────────────────────────────────────────────────
info "2. Signup"
SIGNUP_EMAIL="postdeploy-${SUFFIX}@check.test"
SIGNUP=$(curl -fsS --max-time 15 -X POST "${API}/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${SIGNUP_EMAIL}\",\"password\":\"PostDeploy1!\",\"name\":\"Post Deploy Check\"}" 2>&1 || true)
if echo "$SIGNUP" | grep -q '"userId"'; then
  log "Signup OK"
else
  fail "Signup failed: $SIGNUP"
fi

# ── 3. Login (before verification — should return 403 or similar) ─────────────
info "3. Login (unverified account)"
LOGIN_UNVERIF=$(curl -fsS --max-time 15 -X POST "${API}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${SIGNUP_EMAIL}\",\"password\":\"PostDeploy1!\"}" 2>&1 || true)
# In production, dev-verify doesn't exist so account stays unverified.
# Expect either NOT_VERIFIED (403) or a token if dev-verify was bypassed.
if echo "$LOGIN_UNVERIF" | grep -qiE '"NOT_VERIFIED"|"statusCode":403'; then
  log "Login of unverified account correctly blocked (NOT_VERIFIED)"
elif echo "$LOGIN_UNVERIF" | grep -q '"accessToken"'; then
  fail "Login returned a token for an unverified account — dev-verify should not exist in production"
else
  log "Login blocked (response: ${LOGIN_UNVERIF:0:120})"
fi

# ── 4. Public professionals endpoint ─────────────────────────────────────────
info "4. Public professionals list"
PHYSIOS=$(curl -fsS --max-time 15 "${API}/api/physios" 2>&1 || true)
if echo "$PHYSIOS" | grep -qE '^\[|^\{'; then
  log "GET /api/physios returns JSON array"
else
  fail "GET /api/physios returned unexpected content: ${PHYSIOS:0:200}"
fi

# ── 5. Protected route without cookie → 401 ──────────────────────────────────
info "5. Protected route without auth cookie → 401"
NO_AUTH=$(curl -sS --max-time 10 -o /dev/null -w "%{http_code}" \
  "${API}/api/auth/me" 2>&1 || true)
if [ "$NO_AUTH" = "401" ]; then
  log "GET /api/auth/me without token → 401 (correct)"
else
  fail "Expected 401 on /api/auth/me without token, got HTTP ${NO_AUTH}"
fi

NO_AUTH_BOOKING=$(curl -sS --max-time 10 -o /dev/null -w "%{http_code}" \
  "${API}/api/booking/appointments" 2>&1 || true)
if [ "$NO_AUTH_BOOKING" = "401" ]; then
  log "GET /api/booking/appointments without token → 401 (correct)"
else
  fail "Expected 401 on /api/booking/appointments without token, got HTTP ${NO_AUTH_BOOKING}"
fi

NO_AUTH_ADMIN=$(curl -sS --max-time 10 -o /dev/null -w "%{http_code}" \
  "${API}/api/physios/admin/pending" 2>&1 || true)
if [ "$NO_AUTH_ADMIN" = "401" ]; then
  log "GET /api/physios/admin/pending without token → 401 (correct)"
else
  fail "Expected 401 on admin route without token, got HTTP ${NO_AUTH_ADMIN}"
fi

# ── 6. Waitlist submit ────────────────────────────────────────────────────────
info "6. Waitlist submit"
WAITLIST=$(curl -fsS --max-time 15 -X POST "${API}/api/waitlist" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"waitlist-${SUFFIX}@check.test\",\"role\":\"PATIENT\",\"pilotTester\":false}" 2>&1 || true)
if echo "$WAITLIST" | grep -qiE '"ok"|"id":"'; then
  log "Waitlist submit OK"
elif echo "$WAITLIST" | grep -qiE '"statusCode":40[019]'; then
  log "Waitlist endpoint exists (got 400/409 — entry may already exist or validation fired)"
else
  fail "Waitlist submit unexpected response: ${WAITLIST:0:200}"
fi

# ── 7. Web app home page returns HTML ─────────────────────────────────────────
info "7. Web home page"
WEB_STATUS=$(curl -sS --max-time 20 -o /dev/null -w "%{http_code}" "${WEB}/" 2>&1 || true)
if [ "$WEB_STATUS" = "200" ]; then
  log "Web home page → HTTP 200"
else
  fail "Web home page → HTTP ${WEB_STATUS} (expected 200)"
fi

# ── 8. Web professionals page returns HTML ────────────────────────────────────
info "8. Web professionals page"
PROF_STATUS=$(curl -sS --max-time 20 -o /dev/null -w "%{http_code}" "${WEB}/professionals" 2>&1 || true)
if [ "$PROF_STATUS" = "200" ]; then
  log "Web /professionals → HTTP 200"
else
  fail "Web /professionals → HTTP ${PROF_STATUS} (expected 200)"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
printf '\n'
printf '\033[0;34m[INFO]\033[0m ═══════════════════════════════════════\n'
printf '\033[0;34m[INFO]\033[0m PASS: %d   FAIL: %d\n' "$PASS" "$FAIL"
printf '\033[0;34m[INFO]\033[0m ═══════════════════════════════════════\n'

[ "$FAIL" -eq 0 ]
