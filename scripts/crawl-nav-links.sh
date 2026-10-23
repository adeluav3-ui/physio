#!/usr/bin/env bash
# Crawl every nav link in the web app and verify none returns 404.
# Usage: bash scripts/crawl-nav-links.sh [WEB_BASE]
set -euo pipefail

WEB="${1:-http://localhost:3000}"
PASS=0
FAIL=0

check() {
  local label="$1" url="$2" token="${3:-}"
  local headers=()
  if [ -n "$token" ]; then
    headers+=(-H "Cookie: physio_token=${token}")
  fi
  local code
  code=$(curl -sS --max-time 10 -o /dev/null -w "%{http_code}" "${headers[@]}" "${WEB}${url}")
  if [ "$code" = "200" ] || [ "$code" = "303" ] || [ "$code" = "307" ] || [ "$code" = "308" ]; then
    printf '\033[0;32m[PASS]\033[0m %s %s -> %s\n' "$label" "$url" "$code"
    ((PASS++)) || true
  elif [ "$code" = "401" ] || [ "$code" = "403" ]; then
    printf '\033[0;33m[SKIP]\033[0m %s %s -> %s (auth required — page exists)\n' "$label" "$url" "$code"
    ((PASS++)) || true
  else
    printf '\033[0;31m[FAIL]\033[0m %s %s -> %s\n' "$label" "$url" "$code"
    ((FAIL++)) || true
  fi
}

printf '\033[0;34m[INFO]\033[0m Web base: %s\n' "$WEB"

# Public routes (no auth required)
check "Landing"          "/"
check "Login"            "/auth/login"
check "Signup"           "/auth/signup"
check "Forgot password"  "/auth/forgot"

# Auth-protected patient routes (redirect to login = 307/303, so PASS)
check "Patient dashboard"    "/app"
check "Patient appointments" "/app/appointments"
check "Patient profile"      "/app/profile"
check "Patient physios"      "/app/physios"
check "Patient triage result" "/app/triage/result"

# Auth-protected physio routes
check "Physio dashboard"     "/pro"
check "Physio appointments"  "/pro/appointments"
check "Physio onboarding"    "/pro/onboarding/apply"
check "Physio pending"       "/pro/onboarding/pending"

# Auth-protected admin routes
check "Admin overview"       "/admin"
check "Admin physios"        "/admin/physios"
check "Admin payments"       "/admin/payments"
check "Admin appointments"   "/admin/appointments"
check "Admin triage"         "/admin/triage"
check "Admin home-visits"    "/admin/home-visits"
check "Admin library"        "/admin/library"
check "Admin incidents"      "/admin/incidents"
check "Admin users"          "/admin/users"
check "Admin analytics"      "/admin/analytics"

printf '\n\033[0;34m[INFO]\033[0m ═══════════════════════════════\n'
printf '\033[0;34m[INFO]\033[0m PASS: %d   FAIL: %d\n' "$PASS" "$FAIL"
printf '\033[0;34m[INFO]\033[0m ═══════════════════════════════\n'
[ "$FAIL" -eq 0 ]
