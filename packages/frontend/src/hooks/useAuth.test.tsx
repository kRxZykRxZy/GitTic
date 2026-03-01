import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./useAuth";
import { STORAGE_KEYS } from "../utils/constants";

const authServiceMock = {
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
  clearTokens: vi.fn(),
};

vi.mock("../services/auth-service", () => ({
  authService: authServiceMock,
}));

describe("useAuth", () => {
  it("throws when used outside provider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });

  it("logs in and hydrates the authenticated user", async () => {
    authServiceMock.login.mockResolvedValue({ success: true, data: { token: "t", refreshToken: "r" } });
    authServiceMock.getMe.mockResolvedValue({
      success: true,
      data: { id: "u1", email: "a@a.com", username: "alice", role: "admin" },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    await result.current.login({ login: "alice", password: "secret" });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.username).toBe("alice");
      expect(result.current.isAdmin).toBe(true);
    });
  });

  it("fetches current user on mount when token exists", async () => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "token");
    authServiceMock.getMe.mockResolvedValue({
      success: true,
      data: { id: "u2", email: "m@m.com", username: "mod", role: "moderator" },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user?.username).toBe("mod");
      expect(result.current.isModerator).toBe(true);
    });
  });
});
