import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/lib/auth/auth-context";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}