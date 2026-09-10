import { useRole } from "@/lib/permissions";

export interface FeeAccess {
  role: string;
  isAdmin: boolean;
  isAccountant: boolean;
  isParent: boolean;
  isReader: boolean;
  canCollect: boolean; // can record payments
  canManage: boolean; // can edit fee setup / structures / discounts
}

export function useFeeAccess(): FeeAccess {
  const { activeRole } = useRole();
  const role = activeRole;
  const isAdmin = ["administrator", "principal"].includes(role);
  const isAccountant = role === "accountant";
  const isParent = role === "parent";
  const isReader = ["teacher", "class_teacher"].includes(role);
  const canCollect = isAdmin || isAccountant || isParent;
  const canManage = isAdmin || isAccountant;
  return { role, isAdmin, isAccountant, isParent, isReader, canCollect, canManage };
}