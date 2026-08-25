                                "use client";

import { createContext, useContext } from "react";

import type { User } from "@/lib/api/auth.types";

export type Role = "super_admin" | "principal" | "employee" | "accountant" | "student" | "guardian" | "parent" | null;

export type Permissions = {
  [key in Role]: {
    canViewDashboard: boolean;
    canViewStudents: boolean;
    canViewEmployees: boolean;
    canViewClasses: boolean;
    canViewAttendance: boolean;
    canViewFees: boolean;
    canViewGrades: boolean;
    canViewExams: boolean;
    canViewStaff: boolean;
  };
};

export const permissions: Permissions = {
  super_admin: {
    canViewDashboard: true,
    canViewStudents: true,
    canViewEmployees: true,
    canViewClasses: true,
    canViewAttendance: true,
    canViewFees: true,
    canViewGrades: true,
    canViewExams: true,
    canViewStaff: true,
  },
  principal: {
    canViewDashboard: true,
    canViewStudents: true,
    canViewEmployees: true,
    canViewClasses: true,
    canViewAttendance: true,
    canViewFees: true,
    canViewGrades: true,
    canViewExams: true,
    canViewStaff: true,
  },
  employee: {
    canViewDashboard: false,          // not important for them
    canViewStudents: true,
    canViewEmployees: false,
    canViewClasses: true,
    canViewAttendance: true,
    canViewFees: false,
    canViewGrades: true,
    canViewExams: true,
    canViewStaff: false,
  },
  accountant: {
    canViewDashboard: true,
    canViewStudents: true,
    canViewEmployees: false,
    canViewClasses: false,
    canViewAttendance: true,
    canViewFees: true,
    canViewGrades: false,
    canViewExams: false,
    canViewStaff: false,
  },
  student: {
    canViewDashboard: false,
    canViewStudents: false,
    canViewEmployees: false,
    canViewClasses: false,
    canViewAttendance: true,
    canViewFees: false,
    canViewGrades: true,
    canViewExams: true,
    canViewStaff: false,
  },
  guardian: {
    canViewDashboard: false,
    canViewStudents: true,
    canViewEmployees: false,
    canViewClasses: false,
    canViewAttendance: true,
    canViewFees: false,
    canViewGrades: true,
    canViewExams: true,
    canViewStaff: false,
  },
  parent: {
    canViewDashboard: false,
    canViewStudents: true,
    canViewEmployees: false,
    canViewClasses: false,
    canViewAttendance: true,
    canViewFees: false,
    canViewGrades: true,
    canViewExams: true,
    canViewStaff: false,
  },
  null: {
    canViewDashboard: false,
    canViewStudents: false,
    canViewEmployees: false,
    canViewClasses: false,
    canViewAttendance: false,
    canViewFees: false,
    canViewGrades: false,
    canViewExams: false,
    canViewStaff: false,
  },
};

const RoleContext = createContext<Role>(null);

export function useRole() {
  return useContext(RoleContext);
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  const role = user?.role as Role;
  return (
    <RoleContext.Provider value={role}>{children}</RoleContext.Provider>
  );
}
