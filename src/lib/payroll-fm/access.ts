import { useRole } from "@/lib/permissions";

export interface PayrollAccess {
  role: string;
  /** payroll.read */
  canRead: boolean;
  /** payroll.process — generate, edit drafts, discard, process */
  canProcess: boolean;
  /** payroll.approve */
  canApprove: boolean;
  /** payroll.pay */
  canPay: boolean;
  /** salary-components.read */
  canReadComponents: boolean;
  /** salary-components.create */
  canCreateComponents: boolean;
  /** salary-components.update — rename, change amount, activate/deactivate */
  canUpdateComponents: boolean;
  /** salary-components.delete */
  canDeleteComponents: boolean;
  /** salary-structures.read */
  canReadStructures: boolean;
  /** salary-structures.create */
  canCreateStructures: boolean;
  /** salary-structures.update */
  canUpdateStructures: boolean;
  /** salary-structures.delete */
  canDeleteStructures: boolean;
  /** Any salary-components write permission. */
  canManageComponents: boolean;
  /** Any salary-structures write permission. */
  canManageStructures: boolean;
  /** True when the user can do anything beyond reading. */
  canManage: boolean;
}

/**
 * Payroll access is derived entirely from the user's database permissions, in
 * line with the backend guard. The UI only hides what the API would refuse.
 */
export function usePayrollAccess(): PayrollAccess {
  const { hasPermission, hasAnyPermission, activeRoleName } = useRole();

  const canRead = hasPermission("payroll.read");
  const canProcess = hasPermission("payroll.process");
  const canApprove = hasPermission("payroll.approve");
  const canPay = hasPermission("payroll.pay");

  const canReadComponents = hasPermission("salary-components.read");
  const canCreateComponents = hasPermission("salary-components.create");
  const canUpdateComponents = hasPermission("salary-components.update");
  const canDeleteComponents = hasPermission("salary-components.delete");

  const canReadStructures = hasPermission("salary-structures.read");
  const canCreateStructures = hasPermission("salary-structures.create");
  const canUpdateStructures = hasPermission("salary-structures.update");
  const canDeleteStructures = hasPermission("salary-structures.delete");

  const canManageComponents =
    canCreateComponents || canUpdateComponents || canDeleteComponents;
  const canManageStructures =
    canCreateStructures || canUpdateStructures || canDeleteStructures;

  return {
    role: activeRoleName,
    canRead,
    canProcess,
    canApprove,
    canPay,
    canReadComponents,
    canCreateComponents,
    canUpdateComponents,
    canDeleteComponents,
    canReadStructures,
    canCreateStructures,
    canUpdateStructures,
    canDeleteStructures,
    canManageComponents,
    canManageStructures,
    canManage:
      canProcess ||
      canApprove ||
      canPay ||
      canManageComponents ||
      canManageStructures,
  };
}