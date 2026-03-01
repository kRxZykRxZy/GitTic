import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { User, LoginRequest, RegisterRequest } from "../types/api";
import { authService } from "../services/auth-service";

/** Auth context state */
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Check if we have a stored token */
function hasStoredToken(): boolean {
  try {
    return !!authService.getStoredAccessToken();
  } catch {
    return false;
  }
}

/**
 * AuthProvider wraps the app and provides auth state + actions.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(hasStoredToken());

  /** Fetch the current user profile */
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authService.getMe();
      if (response.success) {
        setUser(response.data);
      } else {
        setUser(null);
        authService.clearTokens();
      }
    } catch {
      setUser(null);
      authService.clearTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  /** On mount, try to load user if token exists */
  useEffect(() => {
    authService.initializeAuthState();

    if (hasStoredToken()) {
      refreshUser();
    }

    return authService.subscribeToAuthStateChanges(() => {
      if (!hasStoredToken()) {
        setUser(null);
      }
    });
  }, [refreshUser]);

  /** Login action */
  const login = useCallback(
    async (credentials: LoginRequest) => {
      const response = await authService.login(credentials);
      if (response.success) {
        await refreshUser();
      }
    },
    [refreshUser],
  );

  /** Register action */
  const register = useCallback(
    async (payload: RegisterRequest) => {
      const response = await authService.register(payload);
      if (response.success) {
        await refreshUser();
      }
    },
    [refreshUser],
  );

  /** Logout action */
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const isAuthenticated = user !== null;
  const isAdmin = user?.role === "admin";
  const isModerator = user?.role === "moderator" || isAdmin;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated,
      isAdmin,
      isModerator,
      login,
      register,
      logout,
      refreshUser,
    }),
    [
      user,
      loading,
      isAuthenticated,
      isAdmin,
      isModerator,
      login,
      register,
      logout,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access the auth context. Must be used within AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
