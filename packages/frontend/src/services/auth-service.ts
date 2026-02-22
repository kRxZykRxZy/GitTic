import { api } from "./api-client";
import {
  ApiResponse,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
} from "../types/api";
import { STORAGE_KEYS } from "../utils/constants";

/** Store tokens in localStorage */
function persistTokens(tokens: AuthTokens): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.token);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
}

/** Remove tokens from localStorage */
function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
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
  const storedRefresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
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
  clearTokens,
} as const;
