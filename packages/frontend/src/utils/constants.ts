/** Base URL for API requests */
export const API_BASE_URL: string =
  (typeof window !== "undefined" &&
    typeof (window as unknown as Record<string, unknown>).__API_BASE_URL__ === "string"
    ? (window as unknown as Record<string, unknown>).__API_BASE_URL__ as string
    : null) ?? "/api/v1";

/** Application version */
export const APP_VERSION = "1.0.0";

/** User role definitions */
export const ROLES = {
  USER: "user" as const,
  MODERATOR: "moderator" as const,
  ADMIN: "admin" as const,
};

/** Ordered list of available roles */
export const ROLE_OPTIONS = [ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN] as const;

/** Token storage keys */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "platform_access_token",
  REFRESH_TOKEN: "platform_refresh_token",
  THEME: "platform_theme",
} as const;

/** Available page sizes for pagination */
export const PAGE_SIZES = [10, 25, 50, 100] as const;

/** Default page size */
export const DEFAULT_PAGE_SIZE = 25;

/** Theme options */
export const THEME_OPTIONS = {
  DARK: "dark",
  LIGHT: "light",
  SYSTEM: "system",
} as const;

/** Debounce delay for search input (ms) */
export const SEARCH_DEBOUNCE_MS = 350;

/** Toast auto-dismiss duration (ms) */
export const TOAST_DURATION_MS = 3000;

/** Countries list for signup */
export const COUNTRIES: ReadonlyArray<{ code: string; name: string }> = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "BR", name: "Brazil" },
  { code: "IN", name: "India" },
  { code: "MX", name: "Mexico" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "FI", name: "Finland" },
  { code: "DK", name: "Denmark" },
  { code: "PL", name: "Poland" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "IE", name: "Ireland" },
  { code: "NZ", name: "New Zealand" },
  { code: "SG", name: "Singapore" },
  { code: "IL", name: "Israel" },
  { code: "ZA", name: "South Africa" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "RU", name: "Russia" },
  { code: "UA", name: "Ukraine" },
  { code: "TR", name: "Turkey" },
  { code: "CN", name: "China" },
  { code: "TW", name: "Taiwan" },
  { code: "HK", name: "Hong Kong" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "PH", name: "Philippines" },
  { code: "MY", name: "Malaysia" },
  { code: "ID", name: "Indonesia" },
  { code: "EG", name: "Egypt" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "OTHER", name: "Other" },
] as const;

/** Search type filter options */
export const SEARCH_TYPES = [
  { value: "all", label: "All" },
  { value: "repos", label: "Repositories" },
  { value: "code", label: "Code" },
  { value: "users", label: "Users" },
] as const;

/** Project visibility options */
export const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "internal", label: "Internal" },
] as const;

/** Time range options for analytics */
export const TIME_RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "custom", label: "Custom" },
] as const;
