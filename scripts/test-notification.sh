#!/usr/bin/env bash
# Sends a Microsoft account verification email as a test notification
# Usage: ./scripts/test-notification.sh [token]
set -euo pipefail

TOKEN="${1:-19282109}"
TITLE="Codice di verifica dell'account"
SCHEMA_ID="org.gnome.shell.extensions.notifications-copier"
SCHEMA_DIR="${XDG_DATA_HOME:-${HOME}/.local/share}/gnome-shell/extensions/notifications-copier@giaffa86/schemas"
BODY="Per accedere alle app e alle risorse di XXX usa il codice seguente per la verifica dell'account. Il codice sarà valido solo per 30 minuti.
Codice di verifica dell'account:
${TOKEN}
Se non hai richiesto un codice, puoi ignorare questo messaggio e-mail.
Informativa sulla privacy
Microsoft Corporation, One Microsoft Way, Redmond, WA 98052"

if [[ -f "${SCHEMA_DIR}/gschemas.compiled" ]]; then
  gsettings --schemadir "${SCHEMA_DIR}" set "${SCHEMA_ID}" last-copied-token "''"
fi

gdbus call --session \
  --dest org.freedesktop.Notifications \
  --object-path /org/freedesktop/Notifications \
  --method org.freedesktop.Notifications.Notify \
  "Notifications Copier Test" \
  0 \
  "" \
  "${TITLE}" \
  "${BODY}" \
  "[]" \
  "{}" \
  5000
