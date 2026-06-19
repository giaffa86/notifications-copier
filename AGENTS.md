# AGENTS.md

## Project type

GNOME Shell Extension (JavaScript, no build system). UUID: `notifications-copier@giaffa86`. Targets GNOME Shell 50.

There is no build step, package manager, test runner, linting, or CI. The `.js` files are loaded directly by GNOME Shell at runtime.

## Install and reload for development

```bash
./scripts/sync-extension.sh
```

This rsyncs the extension to `~/.local/share/gnome-shell/extensions/`, compiles the GSettings schema, and reloads the extension in the running shell. Run it after any code or schema change.

For substantial `extension.js` changes, GJS can cache old modules in the running session. If the extension doesn't pick up changes after reload, use the devkit shell:

```bash
dbus-run-session -- gnome-shell --devkit
```

This opens an isolated GNOME Shell session. Requires `mutter-devkit` installed (`sudo dnf install mutter-devkit` on Fedora).

For debugging logs: `journalctl -f -o cat /usr/bin/gnome-shell`

## Schema compilation

After editing `schemas/org.gnome.shell.extensions.notifications-copier.gschema.xml`, you must compile:

```bash
glib-compile-schemas schemas/
```

The sync script does this automatically as part of its flow.

## Settings

All settings are defined in the gschema XML. Key ones:

- `auto-copy` (bool, default `true`): master toggle
- `token-keywords` (string array): case-insensitive keywords used before numeric/alphanumeric extraction
- `pin-min-digits` / `pin-max-digits` (int): numeric PIN digit range
- `token-min-length` / `token-max-length` (int): alphanumeric fallback length range
- `last-copied-token` (string): internal state to avoid duplicate copies
- `show-confirmation` (bool): shows a GNOME notification on copy

## Token extraction logic

1. `Main.messageTray` source hooks intercept notifications via each source's `notification-added` signal
2. If `auto-copy` is off, skip
3. Scan notification text for `token-keywords` match, then extract:
   - First numeric run within `[pin-min-digits, pin-max-digits]`, or
   - First alphanumeric run within `[token-min-length, token-max-length]` that contains at least one digit
4. Skip if token matches `last-copied-token`
5. Copy to clipboard and optionally show confirmation notification

## Deferred features

- Custom regex extraction is intentionally disabled for the first GNOME Extensions release. Revisit after review because user-provided regex runs synchronously in GNOME Shell and can create ReDoS/freeze risk. If reintroduced, keep it opt-in, validate exactly one capture group, limit input/pattern length, and document the risk.

## GNOME Extensions submission

Submit releases at `https://extensions.gnome.org/upload/`.

Before uploading:
- `metadata.json` must include a valid `url` pointing to the public source repository.
- `shell-version` must only list supported stable GNOME Shell versions (currently `["50"]`).
- Clipboard access via `St.Clipboard` is already declared in `metadata.json` description.
- Do not ship unnecessary local/dev files (`.git`, `.gitignore`, `*.md`, `private`, `.agents`, `.codex`, `.claude`, scripts, generated bundles).

Create the upload zip:

```bash
mkdir -p /tmp/notifications-copier-pack
zip -r -FS /tmp/notifications-copier-pack/notifications-copier@giaffa86.shell-extension.zip \
  metadata.json \
  extension.js \
  prefs.js \
  schemas/org.gnome.shell.extensions.notifications-copier.gschema.xml
```

Do **not** rely on `gnome-extensions pack` unless its output is inspected.

Validate with Shexli before upload:

```bash
python3 -m venv /tmp/shexli-venv
/tmp/shexli-venv/bin/pip install -U shexli
/tmp/shexli-venv/bin/shexli /tmp/notifications-copier-pack/notifications-copier@giaffa86.shell-extension.zip
```

## Key files

| File | Role |
|------|------|
| `metadata.json` | Extension manifest (UUID, shell version `["50"]`) |
| `extension.js` | Entrypoint — `NotificationsCopierExtension` class with `enable()`/`disable()` |
| `prefs.js` | GSettings preferences window (`Adw.PreferencesPage`) |
| `schemas/*.gschema.xml` | GSettings schema |
| `scripts/sync-extension.sh` | Dev install and reload script |

## GNOME Shell safety

- Do not use `Gio.DBus.session.add_filter()` in `extension.js`; it crashes GNOME Shell 50 devkit sessions.
- MessageTray source signal handlers added in `enable()` must be disconnected in `disable()`.
- Do not import GTK or Adw in `extension.js`; keep those in `prefs.js` only.
- Token extraction runs synchronously inside MessageTray signal handlers — keep it fast.

## Standalone script

`code_extractor_dbus_monitor.sh` is a standalone bash script (not part of the extension) that uses `dbus-monitor` + `wl-copy` for the same purpose. Not required for the extension to work.
