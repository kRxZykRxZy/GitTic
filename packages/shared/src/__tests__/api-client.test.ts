import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  API_BASE_URL,
  getAuthHeader,
  buildApiUrl,
  apiRequest,
  api,
} from "../api/client.js";

/**
 * Test suite for API client functions.
 * Tests API client with mocked fetch and localStorage.
 */

describe("API_BASE_URL", () => {
  it("is set to /api/v1", () => {
    expect(API_BASE_URL).toBe("/api/v1");
  });
});

describe("getAuthHeader", () => {
  beforeEach(() => {
    // Mock window and localStorage
    if (typeof window === "undefined") {
      (global as any).window = {};
    }
    (global as any).window.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
  });

  afterEach(() => {
    if ((global as any).window) {
      delete (global as any).window.localStorage;
    }
  });

  it("returns Authorization header when token exists", () => {
    vi.spyOn((global as any).window.localStorage, "getItem").mockReturnValue("test-token-123");
    const header = getAuthHeader();
    expect(header).toEqual({ Authorization: "Bearer test-token-123" });
  });

  it("returns empty object when token does not exist", () => {
    vi.spyOn((global as any).window.localStorage, "getItem").mockReturnValue(null);
    const header = getAuthHeader();
    expect(header).toEqual({});
  });
});

describe("buildApiUrl", () => {
  it("builds URL with leading slash", () => {
    const url = buildApiUrl("/users");
    expect(url).toBe("/api/v1/users");
  });

  it("builds URL without leading slash", () => {
    const url = buildApiUrl("repositories");
    expect(url).toBe("/api/v1/repositories");
  });

  it("handles empty path", () => {
    const url = buildApiUrl("");
    expect(url).toBe("/api/v1/");
  });

  it("handles nested paths", () => {
    const url = buildApiUrl("/users/123/repos");
    expect(url).toBe("/api/v1/users/123/repos");
  });
});

describe("apiRequest", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
    
    // Mock window and localStorage
    if (typeof window === "undefined") {
      (global as any).window = {};
    }
    (global as any).window.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("makes successful GET request", async () => {
    const responseData = { id: "123", name: "Test" };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => responseData,
    });

    const result = await apiRequest("/test");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
    expect(result).toEqual(responseData);
  });

  it("includes auth header when token exists", async () => {
    vi.spyOn((global as any).window.localStorage, "getItem").mockReturnValue("test-token");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest("/test");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );
  });

  it("skips auth header when skipAuth is true", async () => {
    vi.spyOn((global as any).window.localStorage, "getItem").mockReturnValue("test-token");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest("/test", { skipAuth: true });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/test",
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: expect.anything(),
        }),
      })
    );
  });

  it("throws error on non-ok response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(apiRequest("/test")).rejects.toThrow("API Error: 404 Not Found");
  });

  it("merges custom headers", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest("/test", {
      headers: { "X-Custom-Header": "custom-value" },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Custom-Header": "custom-value",
        }),
      })
    );
  });
});

describe("api.get", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
    
    if (typeof window === "undefined") {
      (global as any).window = {};
    }
    (global as any).window.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
  });

  it("makes GET request", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: "test" }),
    });

    const result = await api.get("/users");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/users",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual({ data: "test" });
  });
});

describe("api.post", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
    
    if (typeof window === "undefined") {
      (global as any).window = {};
    }
    (global as any).window.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
  });

  it("makes POST request with body", async () => {
    const requestBody = { name: "New Repo" };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "123" }),
    });

    const result = await api.post("/repositories", requestBody);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/repositories",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(requestBody),
      })
    );
    expect(result).toEqual({ id: "123" });
  });

  it("makes POST request without body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await api.post("/action");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/action",
      expect.objectContaining({
        method: "POST",
        body: undefined,
      })
    );
  });
});

describe("api.put", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
    
    if (typeof window === "undefined") {
      (global as any).window = {};
    }
    (global as any).window.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
  });

  it("makes PUT request with body", async () => {
    const updateData = { name: "Updated Name" };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "123", ...updateData }),
    });

    const result = await api.put("/users/123", updateData);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/users/123",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(updateData),
      })
    );
    expect(result.name).toBe("Updated Name");
  });
});

describe("api.patch", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
    
    if (typeof window === "undefined") {
      (global as any).window = {};
    }
    (global as any).window.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
  });

  it("makes PATCH request with body", async () => {
    const patchData = { description: "New description" };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "123", ...patchData }),
    });

    const result = await api.patch("/repos/123", patchData);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/repos/123",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(patchData),
      })
    );
    expect(result.description).toBe("New description");
  });
});

describe("api.delete", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
    
    if (typeof window === "undefined") {
      (global as any).window = {};
    }
    (global as any).window.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
  });

  it("makes DELETE request", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const result = await api.delete("/repos/123");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/repos/123",
      expect.objectContaining({ method: "DELETE" })
    );
    expect(result).toEqual({ success: true });
  });
});
