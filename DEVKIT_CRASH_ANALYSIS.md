# Devkit Session Crash Analysis

## Symptom

`dbus-run-session -- gnome-shell --devkit` crashes with `Lost connection to Wayland compositor` ~2s after startup when the extension is loaded.

## Root Cause

**`Gio.DBus.session.add_filter()`** causes a C-level crash (segfault) in the devkit session. Not catchable with JS try/catch because the crash happens in the native GJS/GLib binding layer.

## Isolation Tests (binary search)

| # | What was loaded | Result |
|---|----------------|--------|
| 1 | Extension removed entirely | OK, devkit starts |
| 2 | Only `Extension` base class (empty enable/disable) | OK |
| 3 | `Gio` import + `getSettings()` | OK |
| 4 | `Gio` import + `getSettings()` + `add_filter()` (empty callback: `return message`) | **CRASH** |
| 5 | `add_filter()` with arrow function + null-check + try/catch | **CRASH** |

The crash is deterministic: any call to `Gio.DBus.session.add_filter()` in the devkit session kills the shell.

## Alternatives Explored

### MessageTray.Source.prototype.pushNotification monkey-patch

Never called when a notification arrives via D-Bus in GNOME Shell 50. The notification flow in GNOME 50 does not reach `Source.prototype` at that level (toggle was green but no interception occurred).

### MessageTray.Source.prototype.showNotification / notify / _showNotification

Same result: none of these methods are invoked during notification delivery in GNOME 50.

### Main.notificationDaemon

Not available in GNOME 50 (returns `undefined`).

## Conclusions

- **Normal (non-devkit) session**: the old D-Bus filter path can work, but it is too risky for GNOME Shell 50 development.
- **Devkit session**: `add_filter()` is unusable and must not be reintroduced.
- **Current implementation**: connect to `Main.messageTray` `source-added`, then connect each source's `notification-added` signal. This captures notifications after GNOME Shell has converted the D-Bus call into MessageTray objects and avoids the native D-Bus filter crash.

## Side Fix: prefs.js

`Adw.EntryRow` in GNOME 50 does not support the `subtitle` property. Functions `createEntryRow` and `createKeywordsRow` pass it to the constructor, causing:

```
Error: No property subtitle on AdwEntryRow
```

`subtitle` was removed from both constructors. `Adw.SwitchRow`, `Adw.SpinRow`, and `Adw.ActionRow` can still use subtitles.
