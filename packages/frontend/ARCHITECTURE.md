# Frontend Architecture

## Authentication Lifecycle

The frontend uses `src/services/auth-service.ts` as the canonical authentication API.

### Startup

1. `AuthProvider` calls `authService.initializeAuthState()` on mount.
2. Legacy keys (`auth_token`, `refresh_token`, `auth_user`, `token_expiry`) are migrated or removed.
3. If a canonical access token exists (`platform_access_token`), the provider requests `GET /auth/me`.

### Login/Register

1. `authService.login` and `authService.register` call `/auth/login` and `/auth/register`.
2. On success, tokens are persisted under canonical keys:
   - `platform_access_token`
   - `platform_refresh_token`
3. An auth-state event is emitted so local subscribers update immediately.

### Token Refresh

1. `authService.refreshToken` reads `platform_refresh_token`.
2. It requests `/auth/refresh`.
3. On success, access/refresh tokens are atomically replaced in localStorage.

### Logout and Cleanup

1. `authService.logout` sends `/auth/logout` best-effort.
2. It always clears both canonical and legacy auth keys.
3. Auth-state events are emitted so the UI can immediately clear in-memory user state.

### Multi-tab Safety

`authService.subscribeToAuthStateChanges` listens to:
- `storage` events (cross-tab updates)
- `platform:auth-state-changed` custom events (same-tab updates)

`AuthProvider` uses this subscription to clear user state when tokens disappear in another tab.

## Canonical Auth Ownership

- **Source of truth for auth transport/state:** `src/services/auth-service.ts`
- **React integration point:** `src/hooks/useAuth.tsx`
- **Deprecated implementation removed:** `src/services/auth-service-v2.ts`
