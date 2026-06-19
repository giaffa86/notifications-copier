#!/usr/bin/env bash
# Sends a test notification with a fake OTP code
# Usage: ./scripts/test-notification.sh [token]
set -euo pipefail

TOKEN="${1:-123456}"

gdbus call --session \
  --dest org.freedesktop.Notifications \
  --object-path /org/freedesktop/Notifications \
  --method org.freedesktop.Notifications.Notify \
  "Notifications Copier Test" \
  0 \
  "" \
  "Verification Code" \
  "Your code: ${TOKEN}" \
  "[]" \
  "{}" \
  5000
