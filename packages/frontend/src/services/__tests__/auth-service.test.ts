import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../../utils/constants";

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

class WindowMock extends EventTarget {
  location = { href: "" };
}

const { postMock, getMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  getMock: vi.fn(),
}));

vi.mock("../api-client", () => ({
  api: {
    post: postMock,
    get: getMock,
  },
}));

Object.defineProperty(globalThis, "localStorage", {
  value: new MemoryStorage(),
  writable: true,
});
Object.defineProperty(globalThis, "sessionStorage", {
  value: new MemoryStorage(),
  writable: true,
});
Object.defineProperty(globalThis, "window", {
  value: new WindowMock(),
  writable: true,
});

import {
  login,
  logout,
  refreshToken,
  initializeAuthState,
  subscribeToAuthStateChanges,
} from "../auth-service";

describe("auth-service", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("persists access and refresh tokens on login", async () => {
    postMock.mockResolvedValueOnce({
      success: true,
      data: { token: "access-1", refreshToken: "refresh-1" },
    });

    await login({ email: "user@example.com", password: "password" });

    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe("access-1");
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe("refresh-1");
  });

  it("uses refresh token and updates persisted tokens", async () => {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, "refresh-old");
    postMock.mockResolvedValueOnce({
      success: true,
      data: { token: "access-new", refreshToken: "refresh-new" },
    });

    await refreshToken();

    expect(postMock).toHaveBeenCalledWith("/auth/refresh", {
      refreshToken: "refresh-old",
    });
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe("access-new");
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe("refresh-new");
  });

  it("cleans canonical and legacy auth keys on logout", async () => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "access");
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, "refresh");
    localStorage.setItem("auth_token", "legacy-access");
    localStorage.setItem("refresh_token", "legacy-refresh");
    localStorage.setItem("auth_user", '{"id":"1"}');
    localStorage.setItem("token_expiry", "123");
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, "{\"id\":\"canonical\"}");
    postMock.mockResolvedValueOnce({ success: true, data: undefined });

    await logout();

    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.AUTH_USER)).toBeNull();
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
    expect(localStorage.getItem("auth_user")).toBeNull();
    expect(localStorage.getItem("token_expiry")).toBeNull();
  });

  it("notifies listeners for same-tab and cross-tab auth changes", () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeToAuthStateChanges(onChange);

    window.dispatchEvent(new Event("platform:auth-state-changed"));
    const storageEvent = new Event("storage") as Event & { key: string | null };
    storageEvent.key = STORAGE_KEYS.ACCESS_TOKEN;
    window.dispatchEvent(storageEvent);

    expect(onChange).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it("migrates legacy token keys to canonical keys", () => {
    localStorage.setItem("auth_token", "legacy-access");
    localStorage.setItem("refresh_token", "legacy-refresh");
    localStorage.setItem("auth_user", '{"id":"legacy-user"}');
    localStorage.setItem("token_expiry", "123");

    initializeAuthState();

    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe("legacy-access");
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe("legacy-refresh");
    expect(localStorage.getItem(STORAGE_KEYS.AUTH_USER)).toBe('{"id":"legacy-user"}');
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
    expect(localStorage.getItem("auth_user")).toBeNull();
    expect(localStorage.getItem("token_expiry")).toBeNull();
  });
});
