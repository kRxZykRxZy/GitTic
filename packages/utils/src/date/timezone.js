"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimezoneOffset = getTimezoneOffset;
exports.convertTimezone = convertTimezone;
exports.formatOffset = formatOffset;
exports.getKnownTimezones = getKnownTimezones;
exports.isKnownTimezone = isKnownTimezone;
exports.nowUTC = nowUTC;
/**
 * Common timezone abbreviations mapped to their UTC offsets in minutes.
 */
const TIMEZONE_OFFSETS = {
    UTC: 0,
    GMT: 0,
    EST: -300,
    EDT: -240,
    CST: -360,
    CDT: -300,
    MST: -420,
    MDT: -360,
    PST: -480,
    PDT: -420,
    IST: 330,
    CET: 60,
    CEST: 120,
    JST: 540,
    AEST: 600,
    AEDT: 660,
    NZST: 720,
    NZDT: 780,
};
/**
 * Get the UTC offset in minutes for a named timezone abbreviation.
 *
 * @param timezone - The timezone abbreviation (e.g., "EST", "PST").
 * @returns The offset in minutes from UTC, or undefined if not found.
 *
 * @example
 * ```ts
 * getTimezoneOffset("EST"); // => -300
 * getTimezoneOffset("JST"); // => 540
 * ```
 */
function getTimezoneOffset(timezone) {
    return TIMEZONE_OFFSETS[timezone.toUpperCase()];
}
/**
 * Convert a Date to a different timezone by applying the specified offset.
 * Returns a new Date object adjusted to the target timezone.
 *
 * @param date - The source date.
 * @param targetTimezone - The target timezone abbreviation.
 * @returns A new Date adjusted to the target timezone, or the
 *   original date if the timezone is not recognized.
 */
function convertTimezone(date, targetTimezone) {
    const offset = getTimezoneOffset(targetTimezone);
    if (offset === undefined) {
        return new Date(date.getTime());
    }
    const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
    return new Date(utc + offset * 60 * 1000);
}
/**
 * Format a UTC offset in minutes as a "+HH:MM" or "-HH:MM" string.
 *
 * @param offsetMinutes - The offset in minutes from UTC.
 * @returns The formatted offset string.
 *
 * @example
 * ```ts
 * formatOffset(-300); // => "-05:00"
 * formatOffset(330);  // => "+05:30"
 * ```
 */
function formatOffset(offsetMinutes) {
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const abs = Math.abs(offsetMinutes);
    const hours = Math.floor(abs / 60);
    const minutes = abs % 60;
    return `${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}
/**
 * Get all known timezone abbreviations.
 *
 * @returns An array of timezone abbreviation strings.
 */
function getKnownTimezones() {
    return Object.keys(TIMEZONE_OFFSETS);
}
/**
 * Check if a timezone abbreviation is known/supported.
 *
 * @param timezone - The timezone abbreviation to check.
 * @returns `true` if the timezone is recognized.
 */
function isKnownTimezone(timezone) {
    return timezone.toUpperCase() in TIMEZONE_OFFSETS;
}
/**
 * Get the current UTC date and time.
 *
 * @returns A Date object representing the current UTC time.
 */
function nowUTC() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds()));
}
//# sourceMappingURL=timezone.js.map