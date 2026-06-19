# GNOME Extension Review Guidelines

Local checklist for keeping this extension maintainable and acceptable for GNOME Shell review.

## AI Usage

- AI assistance is acceptable, but the final code must be understood, reviewed, and maintainable by the developer.
- Do not submit pasted LLM output that contains unused abstractions, invented APIs, generic defensive code, or prompt-like comments.
- Every non-trivial code path should be explainable in GNOME Shell/GJS terms.

## Code Style

- Keep code small, direct, and consistent with existing GNOME Shell extension patterns.
- Avoid broad `try/catch` blocks unless a specific GNOME/GIO operation can reasonably fail and the recovery behavior is clear.
- Do not leave stale classes, unused settings, backup files, generated bundles, or old implementation copies in the source tree.
- Do not add comments that describe obvious code or mention AI generation.

## GNOME Shell Safety

- Do not use `Gio.DBus.session.add_filter()` in `extension.js`; it crashes GNOME Shell 50 devkit sessions.
- Notification interception uses `Main.messageTray` sources and each source's `notification-added` signal.
- Do not import GTK in Shell runtime code; keep GTK/Adw imports in `prefs.js`.
- Avoid excessive logging in normal runtime paths — this extension runs on every notification.
- Clipboard writes via `St.Clipboard.get_default().set_text()` must be declared in `metadata.json` description.

## Runtime Behavior

- Token extraction runs synchronously when MessageTray emits `notification-added`; keep it fast.
- The `last-copied-token` setting prevents duplicate copies of the same token in sequence.
- Custom regex extraction is deferred for the first release because user-provided regex would run synchronously in GNOME Shell.

## Packaging

- The extension UUID in `metadata.json` must match the installed directory name (`notifications-copier@giaffa86`).
- Keep local-only files out of release/source packages via `.gitignore` and sync-script excludes.
- Compile schemas after schema edits.
- Verify with GNOME Shell after significant `extension.js` changes.
