# Notifications Copier

<p align="center">
  <img src="assets/logo.svg" alt="Notifications Copier logo" width="160">
</p>

GNOME Shell extension that copies verification codes, OTPs, PINs, and short authentication tokens from notifications to the clipboard.

Targets GNOME Shell 50.

## How It Works

The extension watches GNOME Shell notifications through MessageTray. When a notification contains a configured keyword such as `code`, `token`, `otp`, or `pin`, it searches the notification text for:

- a numeric code within the configured digit range, or
- an alphanumeric token within the configured length range that contains at least one digit.

When a token is found, it is copied to the normal clipboard used by `Ctrl+C` / `Ctrl+V`.

## Security And Privacy

This extension is designed to stay local:

- It does not use the network.
- It does not send notification contents anywhere.
- It does not use telemetry.
- It does not spawn external commands.
- It does not keep a token history.
- It copies only to the normal clipboard, not the Linux `PRIMARY` selection clipboard.

There are still important security tradeoffs:

- The extension must read notification titles and bodies to detect codes.
- Any app that can read your clipboard may read a copied token.
- The most recent copied token is stored locally in GSettings only to avoid repeated duplicate copies.
- If confirmation notifications are enabled, the copied token may be shown on screen.

The default behavior is conservative: a keyword must be present before a numeric code or token is copied. This reduces accidental copies from notifications containing unrelated numbers.

## Pros

- Fast OTP copy flow.
- No network access.
- No external dependencies.
- No background service outside GNOME Shell.
- Configurable keywords and code length ranges.
- Optional confirmation notification.

## Cons

- Clipboard contents are visible to local apps with clipboard access.
- Detection depends on notification text and keywords.
- False positives are possible if a notification contains a keyword and a matching number.
- GNOME Shell notification internals can change between Shell versions, so compatibility is declared only for tested versions.

## Settings

- `auto-copy`: master toggle.
- `token-keywords`: case-insensitive keywords that indicate a token may be present.
- `pin-min-digits` / `pin-max-digits`: numeric PIN digit range.
- `token-min-length` / `token-max-length`: alphanumeric fallback range.
- `show-confirmation`: show a GNOME notification after copying.
- `last-copied-token`: internal state used to avoid duplicate copies.

## Development

Install and reload locally:

```bash
./scripts/sync-extension.sh
```

Send a test notification:

```bash
gdbus call --session \
  --dest org.freedesktop.Notifications \
  --object-path /org/freedesktop/Notifications \
  --method org.freedesktop.Notifications.Notify \
  "Test" 0 "" "Verification Code" "Your code: 123456" "[]" "{}" 5000
```

## Packaging

Build a validated local ZIP with `./scripts/package.sh`.

## Languages and local packaging

The interface supports English, Italian, Spanish, German and French, following
the session language. English is the source language and fallback. Identifiers,
user data, detection keywords and external command output are not translated.

The JavaScript runs directly in GNOME Shell. Building the translation catalogues
requires gettext (`xgettext`, `msgmerge`, `msgcmp`, `msgfmt`) and Python 3; local
packaging also requires `zip` and `glib-compile-schemas`.

```sh
./scripts/i18n.sh update   # after changing translatable source strings
./scripts/i18n.sh compile  # compile it/es/de/fr catalogues
./scripts/i18n.sh check    # source coverage, completeness, format and compiled data
./scripts/package.sh      # validate and build dist/<uuid>.shell-extension.zip
```

`po/` holds the editable catalogues and template. The package and sync scripts
compile them and copy only the files in `scripts/runtime-files.txt`, including
`locale/<language>/LC_MESSAGES/<gettext-domain>.mo`. Source catalogues, tests,
development scripts, documentation and `gschemas.compiled` stay out of the ZIP.
Packaging does not install or reload the host extension. The sync script does.

Language verification: [docs/LOCALIZATION.md](docs/LOCALIZATION.md).
