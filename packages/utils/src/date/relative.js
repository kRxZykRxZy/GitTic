"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relativeTime = relativeTime;
exports.dateDiff = dateDiff;
/**
 * Time unit thresholds in milliseconds, ordered from largest to smallest.
 */
const TIME_UNITS = [
    { unit: "year", ms: 365.25 * 24 * 60 * 60 * 1000, max: Infinity },
    { unit: "month", ms: 30.44 * 24 * 60 * 60 * 1000, max: 12 },
    { unit: "week", ms: 7 * 24 * 60 * 60 * 1000, max: 4 },
    { unit: "day", ms: 24 * 60 * 60 * 1000, max: 7 },
    { unit: "hour", ms: 60 * 60 * 1000, max: 24 },
    { unit: "minute", ms: 60 * 1000, max: 60 },
    { unit: "second", ms: 1000, max: 60 },
];
/**
 * Format a date as a human-readable relative time string
 * (e.g., "3 hours ago", "in 2 days").
 *
 * @param date - The date to format.
 * @param options - Optional configuration.
 * @returns A human-readable relative time string.
 *
 * @example
 * ```ts
 * const past = new Date(Date.now() - 3600000);
 * relativeTime(past); // => "1 hour ago"
 *
 * const future = new Date(Date.now() + 86400000 * 3);
 * relativeTime(future); // => "in 3 days"
 * ```
 */
function relativeTime(date, options = {}) {
    const { now = new Date(), addSuffix = true } = options;
    const diffMs = date.getTime() - now.getTime();
    const absDiff = Math.abs(diffMs);
    if (absDiff < 1000) {
        return "just now";
    }
    const parts = getTimeParts(absDiff);
    const description = parts.length > 0 ? parts[0] : "just now";
    if (!addSuffix) {
        return description;
    }
    return diffMs < 0 ? `${description} ago` : `in ${description}`;
}
/**
 * Break a duration in milliseconds into human-readable time parts.
 *
 * @param ms - The duration in milliseconds.
 * @returns An array of formatted time parts (e.g., ["2 hours", "30 minutes"]).
 */
function getTimeParts(ms) {
    const parts = [];
    let remaining = ms;
    for (const { unit, ms: unitMs } of TIME_UNITS) {
        const count = Math.floor(remaining / unitMs);
        if (count > 0) {
            parts.push(`${count} ${unit}${count !== 1 ? "s" : ""}`);
            remaining -= count * unitMs;
        }
    }
    return parts;
}
/**
 * Get the time difference between two dates as a structured object.
 *
 * @param from - The start date.
 * @param to - The end date.
 * @returns An object with the difference broken into units.
 */
function dateDiff(from, to) {
    const totalMs = Math.abs(to.getTime() - from.getTime());
    let remaining = totalMs;
    const years = Math.floor(remaining / (365.25 * 24 * 60 * 60 * 1000));
    remaining -= years * 365.25 * 24 * 60 * 60 * 1000;
    const months = Math.floor(remaining / (30.44 * 24 * 60 * 60 * 1000));
    remaining -= months * 30.44 * 24 * 60 * 60 * 1000;
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    remaining -= days * 24 * 60 * 60 * 1000;
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    remaining -= hours * 60 * 60 * 1000;
    const minutes = Math.floor(remaining / (60 * 1000));
    remaining -= minutes * 60 * 1000;
    const seconds = Math.floor(remaining / 1000);
    return { years, months, days, hours, minutes, seconds, totalMs };
}
//# sourceMappingURL=relative.js.map