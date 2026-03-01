import { api } from "./api-client";
import {
  ApiResponse,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
} from "../types/api";
import { STORAGE_KEYS } from "../utils/constants";

const LEGACY_STORAGE_KEYS = {
  ACCESS_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "auth_user",
  TOKEN_EXPIRY: "token_expiry",
} as const;

const AUTH_STATE_EVENT = "platform:auth-state-changed";

function emitAuthStateChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_STATE_EVENT));
  }
}

/** Store tokens in localStorage */
function persistTokens(tokens: AuthTokens): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.token);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  emitAuthStateChanged();
}

/** Remove tokens from localStorage */
function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  localStorage.removeItem(LEGACY_STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(LEGACY_STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(LEGACY_STORAGE_KEYS.USER);
  localStorage.removeItem(LEGACY_STORAGE_KEYS.TOKEN_EXPIRY);
  emitAuthStateChanged();
}

/** Migrate legacy auth keys to canonical storage keys. */
export function initializeAuthState(): void {
  const legacyAccess = localStorage.getItem(LEGACY_STORAGE_KEYS.ACCESS_TOKEN);
  const legacyRefresh = localStorage.getItem(LEGACY_STORAGE_KEYS.REFRESH_TOKEN);

  if (!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) && legacyAccess) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, legacyAccess);
  }

  if (!localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) && legacyRefresh) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, legacyRefresh);
  }

  const legacyUser = localStorage.getItem(LEGACY_STORAGE_KEYS.USER);
  if (!localStorage.getItem(STORAGE_KEYS.AUTH_USER) && legacyUser) {
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, legacyUser);
  }

  if (legacyAccess || legacyRefresh || legacyUser) {
    localStorage.removeItem(LEGACY_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(LEGACY_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(LEGACY_STORAGE_KEYS.USER);
    localStorage.removeItem(LEGACY_STORAGE_KEYS.TOKEN_EXPIRY);
  }
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/** Subscribe to auth state changes in this tab and other tabs. */
export function subscribeToAuthStateChanges(
  onChange: () => void,
): () => void {
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === STORAGE_KEYS.ACCESS_TOKEN ||
      event.key === STORAGE_KEYS.REFRESH_TOKEN ||
      event.key === null
    ) {
      onChange();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(AUTH_STATE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(AUTH_STATE_EVENT, onChange);
  };
}

/**
 * Authenticate a user with login (email or username) and password.
 * Stores tokens on success.
 */
export async function login(
  credentials: LoginRequest,
): Promise<ApiResponse<AuthTokens>> {
  const response = await api.post<AuthTokens>("/auth/login", credentials);
  if (response.success) {
    persistTokens(response.data);
  }
  return response;
}

/**
 * Register a new user account.
 * Stores tokens on success.
 */
export async function register(
  payload: RegisterRequest,
): Promise<ApiResponse<AuthTokens>> {
  const response = await api.post<AuthTokens>("/auth/register", payload);
  if (response.success) {
    persistTokens(response.data);
  }
  return response;
}

/**
 * Log out the current user. Clears stored tokens.
 */
export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    clearTokens();
  }
}

/**
 * Fetch the currently authenticated user profile.
 */
export async function getMe(): Promise<ApiResponse<User>> {
  return api.get<User>("/auth/me");
}

/**
 * Change the current user's password.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ApiResponse<void>> {
  return api.post<void>("/auth/change-password", {
    currentPassword,
    newPassword,
  });
}

/**
 * Refresh the access token using the stored refresh token.
 */
export async function refreshToken(): Promise<ApiResponse<AuthTokens>> {
  const storedRefresh = getStoredRefreshToken();
  if (!storedRefresh) {
    throw new Error("No refresh token available");
  }

  const response = await api.post<AuthTokens>("/auth/refresh", {
    refreshToken: storedRefresh,
  });

  if (response.success) {
    persistTokens(response.data);
  }

  return response;
}

/** Auth service namespace export */
export const authService = {
  login,
  register,
  logout,
  getMe,
  changePassword,
  refreshToken,
  initializeAuthState,
  subscribeToAuthStateChanges,
  getStoredAccessToken,
  getStoredRefreshToken,
  clearTokens,
} as const;

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  role: "owner" | "admin" | "member" | "viewer";
  memberCount: number;
  repositoryCount: number;
  workflowCount: number;
  subscriptionTier: "free" | "pro" | "enterprise";
}

interface UserWithOrganizations {
  organizations: Organization[];
  currentOrganization?: Organization;
}

function parseStoredUser(): UserWithOrganizations | null {
  const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER) ?? localStorage.getItem(LEGACY_STORAGE_KEYS.USER);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UserWithOrganizations;
  } catch {
    return null;
  }
}

export function getCurrentUserFromStorage(): UserWithOrganizations | null {
  return parseStoredUser();
}

async function fetchV2<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredAccessToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message: unknown }).message)
        : "Request failed";
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function createOrganization(data: {
  name: string;
  slug: string;
  description?: string;
}): Promise<Organization> {
  return fetchV2<Organization>("/api/v2/organizations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function inviteToOrganization(
  organizationId: string,
  data: { email: string; role: "admin" | "member" | "viewer" },
): Promise<void> {
  await fetchV2<void>(`/api/v2/organizations/${organizationId}/invite`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function switchOrganization(
  organizationId: string,
): Promise<UserWithOrganizations> {
  const user = await fetchV2<UserWithOrganizations>(
    `/api/v2/user/switch-organization/${organizationId}`,
    {
      method: "POST",
    },
  );

  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  return user;
}

export async function removeFromOrganization(
  organizationId: string,
  userId: string,
): Promise<void> {
  await fetchV2<void>(`/api/v2/organizations/${organizationId}/members/${userId}`, {
    method: "DELETE",
  });
}

export async function updateMemberRole(
  organizationId: string,
  userId: string,
  role: "admin" | "member" | "viewer",
): Promise<void> {
  await fetchV2<void>(
    `/api/v2/organizations/${organizationId}/members/${userId}/role`,
    {
      method: "PUT",
      body: JSON.stringify({ role }),
    },
  );
}
