import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/lib/auth/auth-context";
import { useRole } from "@/lib/permissions";
import { AccessDenied } from "@/components/auth/access-denied";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasRouteAccess, isLoadingPermissions } = useRole();
  const location = useLocation();

  if (isLoading || isLoadingPermissions) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/" replace state={{ from: location.pathname }} />
    );
  }

  if (!hasRouteAccess(location.pathname)) {
    return <AccessDenied />;
  }

  return <Outlet />;
}