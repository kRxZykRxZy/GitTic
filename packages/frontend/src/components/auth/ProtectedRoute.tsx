import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LoadingSpinner } from "../common/LoadingSpinner";

/** Props for ProtectedRoute */
interface ProtectedRouteProps {
  /** Required role to access the route (optional) */
  requiredRole?: "admin" | "moderator";
  /** Custom redirect path when unauthenticated */
  redirectTo?: string;
}

/**
 * Route guard component that redirects to /login if the user is not authenticated.
 * Optionally checks for a required role (admin or moderator).
 * Uses Outlet to render nested child routes when access is granted.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRole,
  redirectTo = "/login",
}) => {
  const { isAuthenticated, isAdmin, isModerator, loading } = useAuth();
  const location = useLocation();

  /** Loading state while checking auth */
  if (loading) {
    const containerStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "var(--bg-primary)",
      flexDirection: "column",
      gap: "16px",
    };

    return (
      <div style={containerStyle}>
        <LoadingSpinner message="Authenticating…" size="lg" />
      </div>
    );
  }

  /** Not authenticated — redirect to login */
  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  /** Check role requirements if specified */
  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === "moderator" && !isModerator) {
    return <Navigate to="/" replace />;
  }

  /** Access granted — render child routes */
  return <Outlet />;
};
