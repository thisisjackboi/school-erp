"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "./auth/auth-context";
import {
  getRoutesForPermissions,
  ALWAYS_ALLOWED_ROUTES,
} from "./route-permissions";
import type {
  AuthUserPermission,
  AuthUserRole,
} from "./types/auth";

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  group?: string;
  /** Permission code required to see this item. Omitted = always visible. */
  permission?: string;
  /** Any of these permission codes suffice to see this item (takes precedence over `permission`). */
  anyPermission?: string[];
}

export interface NavGroupItem {
  id: string;
  title: string;
  iconName: string;
}

export const NAV_GROUPS: NavGroupItem[] = [
  { id: "administration", title: "Administration", iconName: "Settings" },
  { id: "finance-fees", title: "Finance & Fees", iconName: "Wallet" },
  { id: "academic-setup", title: "Academic Setup", iconName: "School" },
  { id: "students-class", title: "Students & Class", iconName: "Users" },
  { id: "examinations", title: "Examinations", iconName: "GraduationCap" },
];

/**
 * Highest-privilege-first ordering. When a user holds multiple roles the
 * most privileged one drives the dashboard and the active-role badge,
 * instead of whatever `userRoles` returns first from the DB.
 */
export const ROLE_PRIORITY: string[] = [
  "SUPER_ADMIN",
  "SYSTEM_ADMIN",
  "ADMIN",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "ACADEMIC_COORDINATOR",
  "ACCOUNTANT",
  "HR_MANAGER",
  "CLASS_TEACHER",
  "TEACHER",
  "LIBRARIAN",
  "RECEPTIONIST",
  "TRANSPORT_MANAGER",
  "HOSTEL_WARDEN",
  "STUDENT",
  "PARENT",
  "GUARDIAN",
];

export function pickHighestRole(
  userRoles: AuthUserRole[],
): AuthUserRole | undefined {
  let best: AuthUserRole | undefined;
  for (const r of userRoles) {
    const rank = ROLE_PRIORITY.indexOf(r.name.toUpperCase());
    if (rank === -1) continue;
    if (!best || rank < ROLE_PRIORITY.indexOf(best.name.toUpperCase())) {
      best = r;
    }
  }
  return best ?? userRoles[0];
}

export const MODULE_ROUTES: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", iconName: "LayoutDashboard" },
  {
    title: "Users",
    href: "/users",
    iconName: "ShieldCheck",
    group: "administration",
    permission: "users.read",
  },
  {
    title: "Permissions",
    href: "/permissions",
    iconName: "ShieldCheck",
    group: "administration",
    permission: "permissions.read",
  },
  {
    title: "Access Management",
    href: "/access-management",
    iconName: "CalendarDays",
    group: "administration",
    permission: "access.read",
  },
  {
    title: "Designations",
    href: "/designations",
    iconName: "BriefcaseBusiness",
    group: "administration",
    permission: "designations.read",
  },
  {
    title: "Roles",
    href: "/roles",
    iconName: "ShieldCheck",
    group: "administration",
    permission: "roles.read",
  },
  {
    title: "Employees",
    href: "/employees",
    iconName: "UserRound",
    group: "administration",
    permission: "employees.read",
  },
  {
    title: "Academic Session",
    href: "/sessions",
    iconName: "CalendarDays",
    group: "academic-setup",
    permission: "academic-sessions.read",
  },
  {
    title: "Classes & Sections",
    href: "/classes",
    iconName: "School",
    group: "academic-setup",
    permission: "classes.read",
  },
  {
    title: "Subjects",
    href: "/subjects",
    iconName: "BookOpen",
    group: "academic-setup",
    permission: "subjects.read",
  },
  {
    title: "Class–Subject Mapping",
    href: "/class-subjects",
    iconName: "BookOpenCheck",
    group: "academic-setup",
    permission: "class-subjects.read",
  },
  {
    title: "Section Management",
    href: "/sections",
    iconName: "layers",
    group: "academic-setup",
    permission: "sections.read",
  },
  {
    title: "Teacher Subject Assignment",
    href: "/teacher-subject-assignments",
    iconName: "layers",
    group: "academic-setup",
    permission: "teacher-subject-assignments.read",
  },
  {
    title: "Admissions",
    href: "/admissions",
    iconName: "UserPlus",
    permission: "admissions.read",
  },
  {
    title: "Students",
    href: "/students",
    iconName: "Users",
    group: "students-class",
    permission: "students.read",
  },
  {
    title: "Attendance",
    href: "/attendance",
    iconName: "UserCheck",
    group: "students-class",
    permission: "student-attendance.read",
  },
  {
    title: "Timetable",
    href: "/timetable",
    iconName: "Clock",
    group: "students-class",
    anyPermission: ["timetable-periods.read", "timetable-slots.read"],
  },
  {
    title: "Exam Types",
    href: "/exam-types",
    iconName: "Tags",
    group: "examinations",
    permission: "exam-types.read",
  },
  {
    title: "Examinations",
    href: "/exams",
    iconName: "GraduationCap",
    group: "examinations",
    permission: "exams.read",
  },
  {
    title: "Marks & Results",
    href: "/marks-entry",
    iconName: "ClipboardCheck",
    group: "examinations",
    permission: "marks.read",
  },
  {
    title: "Results",
    href: "/results",
    iconName: "BarChart3",
    group: "examinations",
    permission: "exam-results.read",
  },
  {
    title: "Fee Dashboard",
    href: "/fees/dashboard",
    iconName: "LayoutDashboard",
    group: "finance-fees",
    permission: "fees.categories.read",
  },
  {
    title: "Fee Setup & Structures",
    href: "/fees/setup",
    iconName: "Settings",
    group: "finance-fees",
    permission: "fees.categories.read",
  },
  {
    title: "Students & Classes",
    href: "/fees/students",
    iconName: "Users",
    group: "finance-fees",
    permission: "fees.categories.read",
  },
  {
    title: "Collect Fee",
    href: "/fees/collect",
    iconName: "CreditCard",
    group: "finance-fees",
    permission: "fees.categories.read",
  },
  {
    title: "Reports",
    href: "/fees/reports",
    iconName: "BarChart3",
    group: "finance-fees",
    permission: "fees.categories.read",
  },
];

interface RoleContextType {
  userRoles: AuthUserRole[];
  userPermissions: AuthUserPermission[];
  /** Raw permission codes the authenticated user actually holds. */
  permissionCodes: string[];
  /** Routes the user may navigate to (computed from their permissions). */
  allowedRoutes: string[];
  /** Check an action-level permission code, e.g. `hasPermission("classes.create")`. */
  hasPermission: (code: string) => boolean;
  /** Check whether the user may access a specific route. */
  hasRouteAccess: (href: string) => boolean;
  /** True when the user holds ANY of the provided permission codes. */
  hasAnyPermission: (...codes: string[]) => boolean;
  /** Backwards-compatible alias for `hasPermission`. */
  hasActionCode: (code: string) => boolean;
  /** Check whether the user has any permission belonging to a module. */
  hasModule: (module: string) => boolean;
  /** Display name of the first assigned role (falls back to userType). */
  activeRoleName: string;
  isLoadingPermissions: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  const userRoles: AuthUserRole[] = user?.roles ?? [];
  const userPermissions: AuthUserPermission[] = user?.permissions ?? [];

  const permissionCodes = useMemo(
    () => userPermissions.map((p) => p.code),
    [userPermissions],
  );

  const isLoadingPermissions = isLoading && isAuthenticated;

  const allowedRoutes = useMemo(() => {
    if (isLoadingPermissions) {
      return ALWAYS_ALLOWED_ROUTES;
    }
    if (userPermissions.length === 0 && permissionCodes.length === 0) {
      return ALWAYS_ALLOWED_ROUTES;
    }
    return getRoutesForPermissions(userPermissions);
  }, [userPermissions, permissionCodes, isLoadingPermissions]);

  const hasPermission = (code: string) => {
    return permissionCodes.includes(code);
  };

  const hasRouteAccess = (href: string) => {
    if (href === "/") return true;
    if (allowedRoutes.includes(href)) return true;
    // Allow nested sub-routes, e.g. /fees/students/STS-1 when /fees/students is allowed.
    return allowedRoutes.some(
      (route) => href.startsWith(route + "/") && route !== "/dashboard",
    );
  };

  const hasAnyPermission = (...codes: string[]) => {
    return codes.some((code) => permissionCodes.includes(code));
  };

  const hasModule = (module: string) => {
    return userPermissions.some((p) => p.module === module);
  };

  const activeRoleName =
    userRoles.length > 0
      ? pickHighestRole(userRoles)?.name ?? userRoles[0].name
      : user?.userType === "SYSTEM"
        ? "Administrator"
        : user?.userType ?? "User";

  const value: RoleContextType = {
    userRoles,
    userPermissions,
    permissionCodes,
    allowedRoutes,
    hasPermission,
    hasRouteAccess,
    hasAnyPermission,
    hasActionCode: hasPermission,
    hasModule,
    activeRoleName,
    isLoadingPermissions,
  };

  return (
    <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};