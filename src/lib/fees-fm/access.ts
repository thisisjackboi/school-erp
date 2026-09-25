import { useRole } from "@/lib/permissions";

export interface FeeAccess {
  role: string;
  isAdmin: boolean;
  isAccountant: boolean;
  isParent: boolean;
  isReader: boolean;
  canCollect: boolean; // can record payments (fees.collect)
  canManage: boolean; // can edit fee setup / structures / discounts
}

/**
 * All fee access decisions are derived from the authenticated user's actual
 * database permissions, never from the role name.
 */
export function useFeeAccess(): FeeAccess {
  const {
    hasPermission,
    hasAnyPermission,
    activeRoleName,
  } = useRole();

  const canCollect = hasPermission("fees.collect");

  const canManage = hasAnyPermission(
    "fee-structures.create",
    "fee-structures.update",
    "fee-structures.delete",
  );

  const isAdmin = hasAnyPermission(
    "users.read",
    "roles.read",
    "permissions.read",
    "access.read",
  );

  const isAccountant =
    !isAdmin &&
    canCollect &&
    canManage;

  const isParent = false;

  const isReader =
    hasAnyPermission("fees.students.read", "fees.categories.read") &&
    !canCollect &&
    !canManage;

  return {
    role: activeRoleName,
    isAdmin,
    isAccountant,
    isParent,
    isReader,
    canCollect,
    canManage,
  };
}