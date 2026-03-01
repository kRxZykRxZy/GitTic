import { vi } from "vitest";

export const apiMock = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

export function resetApiMock(): void {
  for (const fn of Object.values(apiMock)) {
    fn.mockReset();
  }
}

export const apiClientMockModule = {
  api: apiMock,
};
