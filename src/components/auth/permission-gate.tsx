import React from "react";
import { useRole } from "@/lib/permissions";

interface PermissionGateProps {
  /** Required permission code, e.g. "classes.create" */
  permission: string;
  /** Any single one of these codes is enough when provided. */
  anyPermission?: string[];
  children: React.ReactNode;
}

/**
 * Renders its children only when the authenticated user holds the required
 * permission code (or any code from `anyPermission`).
 */
export function PermissionGate({
  permission,
  anyPermission,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission } = useRole();

  const allowed = anyPermission?.length
    ? hasAnyPermission(...anyPermission)
    : hasPermission(permission);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}