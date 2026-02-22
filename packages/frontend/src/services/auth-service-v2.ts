/**
 * Enhanced Authentication Service
 * Handles user authentication, organization management, and session management.
 */

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  subscriptionTier: "free" | "pro" | "enterprise";
  organizations: Organization[];
  currentOrganization?: Organization;
}

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
  settings: OrganizationSettings;
}

export interface OrganizationSettings {
  allowPublicRepositories: boolean;
  allowPublicWorkflows: boolean;
  requireTwoFactor: boolean;
  defaultRepositoryVisibility: "public" | "private";
  enforceWorkflowApproval: boolean;
  allowedDomains?: string[];
  ssoEnabled: boolean;
  ssoProvider?: "saml" | "oidc" | "azure" | "google";
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  inviteCode?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

class AuthServiceV2 {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private user: User | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    this.loadFromStorage();
    this.setupTokenRefresh();
  }

  /**
   * Load authentication data from localStorage
   */
  private loadFromStorage(): void {
    try {
      const token = localStorage.getItem("auth_token");
      const refreshToken = localStorage.getItem("refresh_token");
      const user = localStorage.getItem("auth_user");
      const tokenExpiry = localStorage.getItem("token_expiry");

      if (token && user && tokenExpiry) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.user = JSON.parse(user);
        this.tokenExpiry = parseInt(tokenExpiry);

        // Check if token is expired
        if (this.isTokenExpired()) {
          this.refreshTokenIfNeeded();
        }
      }
    } catch (error) {
      console.error("Error loading auth data:", error);
      this.clearStorage();
    }
  }

  /**
   * Save authentication data to localStorage
   */
  private saveToStorage(): void {
    if (this.token && this.user && this.tokenExpiry) {
      localStorage.setItem("auth_token", this.token);
      localStorage.setItem("refresh_token", this.refreshToken || "");
      localStorage.setItem("auth_user", JSON.stringify(this.user));
      localStorage.setItem("token_expiry", this.tokenExpiry.toString());
    }
  }

  /**
   * Clear authentication data from storage
   */
  private clearStorage(): void {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("token_expiry");
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    this.tokenExpiry = null;
  }

  /**
   * Check if the current token is expired
   */
  private isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    return Date.now() >= this.tokenExpiry;
  }

  /**
   * Setup automatic token refresh
   */
  private setupTokenRefresh(): void {
    setInterval(() => {
      if (this.token && this.isTokenExpired()) {
        this.refreshTokenIfNeeded();
      }
    }, 60000); // Check every minute
  }

  /**
   * Refresh token if needed
   */
  private async refreshTokenIfNeeded(): Promise<void> {
    if (this.refreshToken && !this.isTokenExpired()) {
      try {
        await this.refreshAccessToken();
      } catch (error) {
        console.error("Token refresh failed:", error);
        this.logout();
      }
    }
  }

  /**
   * Get current authentication token
   */
  getAuthToken(): string | null {
    return this.token;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.token && this.user && !this.isTokenExpired());
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch("/api/v2/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const authData: AuthResponse = await response.json();
    this.setAuthData(authData, credentials.rememberMe);
    return authData;
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch("/api/v2/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    const authData: AuthResponse = await response.json();
    this.setAuthData(authData);
    return authData;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch("/api/v2/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.clearStorage();
      window.location.href = "/login";
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch("/api/v2/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    const authData: AuthResponse = await response.json();
    this.setAuthData(authData);
  }

  /**
   * Set authentication data
   */
  private setAuthData(authData: AuthResponse, rememberMe: boolean = false): void {
    this.token = authData.token;
    this.refreshToken = authData.refreshToken;
    this.user = authData.user;
    this.tokenExpiry = Date.now() + (authData.expiresIn * 1000);

    if (rememberMe) {
      this.saveToStorage();
    } else {
      // Use sessionStorage for non-remembered sessions
      sessionStorage.setItem("auth_token", authData.token);
      sessionStorage.setItem("auth_user", JSON.stringify(authData.user));
      sessionStorage.setItem("token_expiry", this.tokenExpiry.toString());
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    const response = await fetch("/api/v2/auth/password-reset/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Password reset request failed");
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    const response = await fetch("/api/v2/auth/password-reset/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Password reset confirmation failed");
    }
  }

  /**
   * Setup two-factor authentication
   */
  async setupTwoFactor(): Promise<TwoFactorSetupResponse> {
    const response = await fetch("/api/v2/auth/2fa/setup", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "2FA setup failed");
    }

    return response.json();
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor(code: string): Promise<void> {
    const response = await fetch("/api/v2/auth/2fa/enable", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "2FA enable failed");
    }
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(code: string): Promise<void> {
    const response = await fetch("/api/v2/auth/2fa/disable", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "2FA disable failed");
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await fetch("/api/v2/user/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Profile update failed");
    }

    const updatedUser: User = await response.json();
    this.user = updatedUser;
    this.saveToStorage();
    return updatedUser;
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch("/api/v2/user/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Password change failed");
    }
  }

  /**
   * Get active sessions
   */
  async getSessions(): Promise<SessionInfo[]> {
    const response = await fetch("/api/v2/user/sessions", {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch sessions");
    }

    return response.json();
  }

  /**
   * Revoke a session
   */
  async revokeSession(sessionId: string): Promise<void> {
    const response = await fetch(`/api/v2/user/sessions/${sessionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to revoke session");
    }
  }

  /**
   * Switch to a different organization
   */
  async switchOrganization(organizationId: string): Promise<User> {
    const response = await fetch(`/api/v2/user/switch-organization/${organizationId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Organization switch failed");
    }

    const updatedUser: User = await response.json();
    this.user = updatedUser;
    this.saveToStorage();
    return updatedUser;
  }

  /**
   * Create a new organization
   */
  async createOrganization(data: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<Organization> {
    const response = await fetch("/api/v2/organizations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Organization creation failed");
    }

    const organization: Organization = await response.json();
    
    // Update user's organizations list
    if (this.user) {
      this.user.organizations.push(organization);
      this.saveToStorage();
    }

    return organization;
  }

  /**
   * Update organization settings
   */
  async updateOrganizationSettings(
    organizationId: string,
    settings: Partial<OrganizationSettings>
  ): Promise<Organization> {
    const response = await fetch(`/api/v2/organizations/${organizationId}/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Organization settings update failed");
    }

    const updatedOrganization: Organization = await response.json();
    
    // Update user's organization in the list
    if (this.user) {
      const orgIndex = this.user.organizations.findIndex(org => org.id === organizationId);
      if (orgIndex !== -1) {
        this.user.organizations[orgIndex] = updatedOrganization;
        if (this.user.currentOrganization?.id === organizationId) {
          this.user.currentOrganization = updatedOrganization;
        }
        this.saveToStorage();
      }
    }

    return updatedOrganization;
  }

  /**
   * Invite user to organization
   */
  async inviteToOrganization(
    organizationId: string,
    data: {
      email: string;
      role: "admin" | "member" | "viewer";
    }
  ): Promise<void> {
    const response = await fetch(`/api/v2/organizations/${organizationId}/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Organization invitation failed");
    }
  }

  /**
   * Remove member from organization
   */
  async removeFromOrganization(organizationId: string, userId: string): Promise<void> {
    const response = await fetch(`/api/v2/organizations/${organizationId}/members/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Member removal failed");
    }
  }

  /**
   * Update member role in organization
   */
  async updateMemberRole(
    organizationId: string,
    userId: string,
    role: "admin" | "member" | "viewer"
  ): Promise<void> {
    const response = await fetch(`/api/v2/organizations/${organizationId}/members/${userId}/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Role update failed");
    }
  }
}

// Export singleton instance
export const authServiceV2 = new AuthServiceV2();