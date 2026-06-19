import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";

import {ExtensionPreferences, gettext as _} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

function createSpinRow(settings, key, title, subtitle, min, max) {
    const adjustment = new Gtk.Adjustment({
        lower: min,
        upper: max,
        step_increment: 1,
        page_increment: 2,
    });

    const row = new Adw.SpinRow({
        title,
        subtitle,
        adjustment,
        value: settings.get_int(key),
    });

    row.connect("notify::value", () => {
        settings.set_int(key, row.value);
    });
    settings.connect(`changed::${key}`, () => {
        row.value = settings.get_int(key);
    });

    const resetButton = new Gtk.Button({
        icon_name: "edit-undo-symbolic",
        valign: Gtk.Align.CENTER,
        tooltip_text: _("Reset to default"),
    });
    resetButton.connect("clicked", () => {
        settings.reset(key);
    });
    settings.connect(`changed::${key}`, () => {
        resetButton.sensitive = settings.get_user_value(key) !== null;
    });
    resetButton.sensitive = settings.get_user_value(key) !== null;
    row.add_suffix(resetButton);

    return row;
}

function createSwitchRow(settings, key, title, subtitle) {
    const row = new Adw.SwitchRow({
        title,
        subtitle,
    });
    settings.bind(key, row, "active", Gio.SettingsBindFlags.DEFAULT);

    const resetButton = new Gtk.Button({
        icon_name: "edit-undo-symbolic",
        valign: Gtk.Align.CENTER,
        tooltip_text: _("Reset to default"),
    });
    resetButton.connect("clicked", () => {
        settings.reset(key);
    });
    settings.connect(`changed::${key}`, () => {
        resetButton.sensitive = settings.get_user_value(key) !== null;
    });
    resetButton.sensitive = settings.get_user_value(key) !== null;
    row.add_suffix(resetButton);

    return row;
}

function createKeywordsRow(settings, key, title) {
    const row = new Adw.EntryRow({
        title,
        show_apply_button: true,
    });

    let _updating = false;

    const syncFromSettings = () => {
        if (_updating)
            return;
        _updating = true;
        const keywords = settings.get_strv(key);
        row.text = keywords.join(", ");
        _updating = false;
    };

    syncFromSettings();
    row.connect("notify::text", () => {
        if (_updating)
            return;
        _updating = true;
        const parts = row.text
            .split(",")
            .map(s => s.trim())
            .filter(s => s.length > 0);
        settings.set_strv(key, parts);
        _updating = false;
    });
    settings.connect(`changed::${key}`, syncFromSettings);

    const resetButton = new Gtk.Button({
        icon_name: "edit-undo-symbolic",
        valign: Gtk.Align.CENTER,
        tooltip_text: _("Reset to default"),
    });
    resetButton.connect("clicked", () => {
        settings.reset(key);
    });
    settings.connect(`changed::${key}`, () => {
        resetButton.sensitive = settings.get_user_value(key) !== null;
    });
    resetButton.sensitive = settings.get_user_value(key) !== null;
    row.add_suffix(resetButton);

    return row;
}

function createClearLastCopiedTokenRow(settings) {
    const row = new Adw.ActionRow({
        title: _("Last copied token"),
        subtitle: _("Clear the remembered token so the same code can be copied again"),
    });

    const clearButton = new Gtk.Button({
        label: _("Clear"),
        valign: Gtk.Align.CENTER,
    });
    clearButton.connect("clicked", () => {
        settings.reset("last-copied-token");
    });
    settings.connect("changed::last-copied-token", () => {
        clearButton.sensitive = settings.get_string("last-copied-token") !== "";
    });
    clearButton.sensitive = settings.get_string("last-copied-token") !== "";
    row.add_suffix(clearButton);

    return row;
}

export default class NotificationsCopierPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();
        window.search_enabled = true;

        const generalPage = new Adw.PreferencesPage({
            title: _("General"),
            icon_name: "dialog-information-symbolic",
        });
        window.add(generalPage);

        const behaviourGroup = new Adw.PreferencesGroup({
            title: _("Behaviour"),
            description: _("Configure automatic token detection and copying"),
        });
        generalPage.add(behaviourGroup);

        behaviourGroup.add(createSwitchRow(
            window._settings,
            "auto-copy",
            _("Auto-copy tokens"),
            _("Automatically copy detected tokens and PINs to the clipboard"),
        ));

        behaviourGroup.add(createSwitchRow(
            window._settings,
            "show-confirmation",
            _("Show confirmation"),
            _("Show a notification when a token is copied to the clipboard"),
        ));

        const patternsGroup = new Adw.PreferencesGroup({
            title: _("Patterns"),
            description: _("Keywords are comma-separated and matched case-insensitively against notification text."),
        });
        generalPage.add(patternsGroup);

        patternsGroup.add(createKeywordsRow(
            window._settings,
            "token-keywords",
            _("Token keywords"),
        ));

        const pinGroup = new Adw.PreferencesGroup({
            title: _("PIN Range"),
            description: _("Numeric code digit range for keyword-based detection."),
        });
        generalPage.add(pinGroup);

        pinGroup.add(createSpinRow(
            window._settings,
            "pin-min-digits",
            _("Minimum PIN digits"),
            _("Minimum number of digits to consider a numeric sequence as a PIN"),
            3,
            6,
        ));

        pinGroup.add(createSpinRow(
            window._settings,
            "pin-max-digits",
            _("Maximum PIN digits"),
            _("Maximum number of digits to consider a numeric sequence as a PIN"),
            4,
            12,
        ));

        const fallbackGroup = new Adw.PreferencesGroup({
            title: _("Alphanumeric Fallback"),
            description: _("When no numeric PIN is found near a keyword, an alphanumeric token is searched instead."),
        });
        generalPage.add(fallbackGroup);

        fallbackGroup.add(createSpinRow(
            window._settings,
            "token-min-length",
            _("Minimum token length"),
            _("Minimum character length for alphanumeric token fallback"),
            4,
            32,
        ));

        fallbackGroup.add(createSpinRow(
            window._settings,
            "token-max-length",
            _("Maximum token length"),
            _("Maximum character length for alphanumeric token fallback"),
            6,
            128,
        ));

        const stateGroup = new Adw.PreferencesGroup({
            title: _("State"),
            description: _("Troubleshooting helpers"),
        });
        generalPage.add(stateGroup);

        stateGroup.add(createClearLastCopiedTokenRow(window._settings));
    }
}
