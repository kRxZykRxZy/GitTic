/**
 * Format an ISO date string to a localized date/time string.
 */
export function formatDate(
    isoString: string | null | undefined,
    options?: Intl.DateTimeFormatOptions,
): string {
    if (!isoString) {
        return "No date";
    }

    const date = new Date(isoString);
    const defaults: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        ...options,
    };
    return date.toLocaleDateString("en-US", defaults);
}

/**
 * Format a date as a relative time string (e.g. "3 minutes ago").
 */
export function formatRelativeTime(isoString: string | null | undefined): string {
    if (!isoString) {
        return "Never";
    }

    const date = new Date(isoString);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 5) return "just now";
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin === 1) return "1 minute ago";
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour === 1) return "1 hour ago";
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay === 1) return "yesterday";
    if (diffDay < 7) return `${diffDay} days ago`;
    if (diffWeek === 1) return "1 week ago";
    if (diffWeek < 4) return `${diffWeek} weeks ago`;
    if (diffMonth === 1) return "1 month ago";
    if (diffMonth < 12) return `${diffMonth} months ago`;
    if (diffYear === 1) return "1 year ago";
    return `${diffYear} years ago`;
}

/**
 * Format a byte count into a human-readable string (e.g. "1.5 MB").
 */
export function formatBytes(bytes: number | null | undefined, decimals = 1): string {
    // Handle null/undefined values
    if (bytes === null || bytes === undefined || isNaN(bytes)) {
        return "0 Bytes";
    }

    if (bytes === 0) return "0 Bytes";
    if (bytes < 0) return "Invalid size";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const index = Math.min(i, sizes.length - 1);
    const value = bytes / Math.pow(k, index);

    return `${value.toFixed(decimals)} ${sizes[index]}`;
}

/**
 * Format a number with locale-aware separators and optional suffix (K, M, B).
 */
export function formatNumber(num: number | null | undefined, compact = false): string {
    // Handle null/undefined values
    if (num === null || num === undefined || isNaN(num)) {
        return "0";
    }

    if (compact) {
        if (num >= 1_000_000_000) {
            return `${(num / 1_000_000_000).toFixed(1)}B`;
        }
        if (num >= 1_000_000) {
            return `${(num / 1_000_000).toFixed(1)}M`;
        }
        if (num >= 1_000) {
            return `${(num / 1_000).toFixed(1)}K`;
        }
    }
    return num.toLocaleString("en-US");
}

/**
 * Truncate text to a maximum length, appending an ellipsis if truncated.
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
    if (!text) {
        return "";
    }

    if (text.length <= maxLength) {
        return text;
    }
    return `${text.substring(0, maxLength)}…`;
}

/**
 * Format a duration in seconds to a human-readable string (e.g. "2m 15s").
 */
export function formatDuration(seconds: number | null | undefined): string {
    // Handle null/undefined values
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
        return "0s";
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);

    if (mins < 60) {
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }

    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

/**
 * Format a percentage value with a sign prefix.
 */
export function formatPercentChange(value: number | null | undefined): string {
    // Handle null/undefined values
    if (value === null || value === undefined || isNaN(value)) {
        return "0%";
    }

    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
}

