# API Client Mocking Strategy

Use `apiMock` from `api-client.ts` for deterministic component tests that depend on `services/api-client`.

## Pattern

1. In the test file, mock the module once:

```ts
import { apiClientMockModule, apiMock, resetApiMock } from "../test/mocks/api-client";
vi.mock("../services/api-client", () => apiClientMockModule);
```

2. Reset in `beforeEach` and assign route-specific responses:

```ts
beforeEach(() => {
  resetApiMock();
  apiMock.get.mockResolvedValue({ success: true, data: {} });
});
```

This keeps tests fast and consistent without per-test `fetch` stubbing.
