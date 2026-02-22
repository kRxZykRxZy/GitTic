"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDuration = parseDuration;
exports.toMilliseconds = toMilliseconds;
exports.formatDuration = formatDuration;
exports.parseShortDuration = parseShortDuration;
/**
 * Parse a duration in milliseconds into a structured Duration object.
 *
 * @param ms - The total duration in milliseconds.
 * @returns A Duration object with days, hours, minutes, seconds, and milliseconds.
 *
 * @example
 * ```ts
 * parseDuration(90061000);
 * // => { days: 1, hours: 1, minutes: 1, seconds: 1, milliseconds: 0 }
 * ```
 */
function parseDuration(ms) {
    const abs = Math.abs(ms);
    const days = Math.floor(abs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((abs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((abs % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((abs % (60 * 1000)) / 1000);
    const milliseconds = abs % 1000;
    return { days, hours, minutes, seconds, milliseconds };
}
/**
 * Convert a Duration object to total milliseconds.
 *
 * @param duration - The duration to convert.
 * @returns The total duration in milliseconds.
 */
function toMilliseconds(duration) {
    const { days = 0, hours = 0, minutes = 0, seconds = 0, milliseconds = 0, } = duration;
    return (days * 24 * 60 * 60 * 1000 +
        hours * 60 * 60 * 1000 +
        minutes * 60 * 1000 +
        seconds * 1000 +
        milliseconds);
}
/**
 * Format a duration in milliseconds as a human-readable string.
 *
 * @param ms - The total duration in milliseconds.
 * @param verbose - Whether to use verbose labels (e.g., "hours" vs "h").
 *   Defaults to false.
 * @returns A formatted duration string.
 *
 * @example
 * ```ts
 * formatDuration(3661000);       // => "1h 1m 1s"
 * formatDuration(3661000, true); // => "1 hour 1 minute 1 second"
 * ```
 */
function formatDuration(ms, verbose = false) {
    const d = parseDuration(ms);
    const parts = [];
    if (d.days > 0) {
        parts.push(verbose ? `${d.days} day${d.days !== 1 ? "s" : ""}` : `${d.days}d`);
    }
    if (d.hours > 0) {
        parts.push(verbose ? `${d.hours} hour${d.hours !== 1 ? "s" : ""}` : `${d.hours}h`);
    }
    if (d.minutes > 0) {
        parts.push(verbose ? `${d.minutes} minute${d.minutes !== 1 ? "s" : ""}` : `${d.minutes}m`);
    }
    if (d.seconds > 0) {
        parts.push(verbose ? `${d.seconds} second${d.seconds !== 1 ? "s" : ""}` : `${d.seconds}s`);
    }
    if (parts.length === 0) {
        parts.push(verbose
            ? `${d.milliseconds} millisecond${d.milliseconds !== 1 ? "s" : ""}`
            : `${d.milliseconds}ms`);
    }
    return parts.join(" ");
}
/**
 * Parse a shorthand duration string like "1d 2h 30m" into milliseconds.
 *
 * @param input - The shorthand duration string.
 * @returns The total duration in milliseconds.
 * @throws If the input format is invalid.
 *
 * @example
 * ```ts
 * parseShortDuration("2h 30m"); // => 9000000
 * parseShortDuration("1d");     // => 86400000
 * ```
 */
function parseShortDuration(input) {
    const pattern = /(\d+)\s*(d|h|m|s|ms)/gi;
    let total = 0;
    let matched = false;
    let match;
    while ((match = pattern.exec(input)) !== null) {
        matched = true;
        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        switch (unit) {
            case "d":
                total += value * 24 * 60 * 60 * 1000;
                break;
            case "h":
                total += value * 60 * 60 * 1000;
                break;
            case "m":
                total += value * 60 * 1000;
                break;
            case "s":
                total += value * 1000;
                break;
            case "ms":
                total += value;
                break;
        }
    }
    if (!matched) {
        throw new Error(`Invalid duration string: "${input}"`);
    }
    return total;
}
//# sourceMappingURL=duration.js.map