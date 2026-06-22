"use strict";

import St from "gi://St";

import * as Main from "resource:///org/gnome/shell/ui/main.js";

import {Extension} from "resource:///org/gnome/shell/extensions/extension.js";

function hasTokenKeyword(text, keywords) {
    if (!text)
        return false;
    const lower = text.toLowerCase();
    return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

function extractToken(text, keywords, minDigits, maxDigits, tokenMinLen, tokenMaxLen) {
    if (!text)
        return null;

    if (!hasTokenKeyword(text, keywords))
        return null;

    const pinPattern = new RegExp(`\\b(\\d{${minDigits},${maxDigits}})\\b`, "g");
    const numericMatches = [...text.matchAll(pinPattern)];

    if (numericMatches.length > 0)
        return numericMatches[0][1];

    const alphanumPattern = new RegExp(`\\b([A-Za-z0-9]{${tokenMinLen},${tokenMaxLen}})\\b`);
    const tokenMatch = text.match(alphanumPattern);

    if (tokenMatch && /\d/.test(tokenMatch[1]))
        return tokenMatch[1];

    return null;
}

export default class NotificationsCopierExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._watchedSources = new Set();

        Main.messageTray.connectObject(
            "source-added",
            (_tray, source) => this._watchSource(source),
            this
        );

        for (const source of this._getMessageTraySources())
            this._watchSource(source);
    }

    _getMessageTraySources() {
        return Main.messageTray.getSources();
    }

    _watchSource(source) {
        if (!source || this._watchedSources.has(source))
            return;

        source.connectObject(
            "notification-added",
            (_source, notification) => this._processNotification(notification),
            this
        );
        this._watchedSources.add(source);
    }

    _processNotification(notification) {
        if (!notification)
            return;

        const title = notification.title || notification._title || "";
        const body = notification.body ||
            notification.bannerBodyText ||
            // Private field fallbacks cover GNOME Shell notification internals.
            notification._body ||
            notification._bannerBodyText ||
            "";

        this._processRawText(title, body);
    }

    _processRawText(title, body) {
        if (!this._settings.get_boolean("auto-copy"))
            return;

        const combined = `${title} ${body}`;

        let token = null;

        const keywords = this._settings.get_strv("token-keywords");
        const configuredMinDigits = this._settings.get_int("pin-min-digits");
        const configuredMaxDigits = this._settings.get_int("pin-max-digits");
        const configuredTokenMinLen = this._settings.get_int("token-min-length");
        const configuredTokenMaxLen = this._settings.get_int("token-max-length");
        const minDigits = Math.min(configuredMinDigits, configuredMaxDigits);
        const maxDigits = Math.max(configuredMinDigits, configuredMaxDigits);
        const tokenMinLen = Math.min(configuredTokenMinLen, configuredTokenMaxLen);
        const tokenMaxLen = Math.max(configuredTokenMinLen, configuredTokenMaxLen);

        token = extractToken(combined, keywords, minDigits, maxDigits, tokenMinLen, tokenMaxLen);

        if (!token)
            return;

        const lastToken = this._settings.get_string("last-copied-token");
        if (lastToken === token)
            return;

        this._settings.set_string("last-copied-token", token);

        const clipboard = St.Clipboard.get_default();
        clipboard.set_text(St.ClipboardType.CLIPBOARD, token);

        if (this._settings.get_boolean("show-confirmation"))
            Main.notify("Token Copied", token);
    }

    disable() {

        Main.messageTray.disconnectObject(this);

        if (this._watchedSources) {
            for (const source of this._watchedSources)
                source.disconnectObject(this);
            this._watchedSources.clear();
            this._watchedSources = null;
        }

        this._settings = null;
    }
}
