"use client";

import React from "react";
import { useRole, pickHighestRole } from "@/lib/permissions";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { PrincipalDashboard } from "@/components/dashboards/principal-dashboard";
import { TeacherDashboard } from "@/components/dashboards/teacher-dashboard";
import { StudentDashboard } from "@/components/dashboards/student-dashboard";
import { ParentDashboard } from "@/components/dashboards/parent-dashboard";
import { AccountantDashboard } from "@/components/dashboards/accountant-dashboard";
import { HRDashboard } from "@/components/dashboards/hr-dashboard";
import {
  LibrarianDashboard,
  ReceptionistDashboard,
  TransportDashboard,
  HostelDashboard,
  VicePrincipalDashboard,
  AcademicCoordinatorDashboard,
  ClassTeacherDashboard,
} from "@/components/dashboards/other-dashboards";

const ROLE_DASHBOARD_MAP: Record<string, React.ComponentType> = {
  SUPER_ADMIN: AdminDashboard,
  ADMIN: AdminDashboard,
  SYSTEM_ADMIN: AdminDashboard,
  PRINCIPAL: PrincipalDashboard,
  VICE_PRINCIPAL: VicePrincipalDashboard,
  ACADEMIC_COORDINATOR: AcademicCoordinatorDashboard,
  ACCOUNTANT: AccountantDashboard,
  HR_MANAGER: HRDashboard,
  TEACHER: TeacherDashboard,
  CLASS_TEACHER: ClassTeacherDashboard,
  LIBRARIAN: LibrarianDashboard,
  RECEPTIONIST: ReceptionistDashboard,
  TRANSPORT_MANAGER: TransportDashboard,
  HOSTEL_WARDEN: HostelDashboard,
  STUDENT: StudentDashboard,
  PARENT: ParentDashboard,
  GUARDIAN: ParentDashboard,
};

export default function DashboardPage() {
  const { activeRoleName, userRoles } = useRole();

  const normalized =
    (pickHighestRole(userRoles)?.name ?? activeRoleName).toUpperCase();

  const Dashboard =
    ROLE_DASHBOARD_MAP[normalized] ??
    ROLE_DASHBOARD_MAP["SUPER_ADMIN"] ??
    AdminDashboard;

  return (
    <div className="space-y-4">
      {/* Role Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-slate-900 text-white shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold">PrismaEd+ Workspace</h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600/60 font-bold uppercase">
              {activeRoleName || "User"} View
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Permission-driven workspace for your assigned role.
          </p>
        </div>
      </div>

      {/* Render Role Dashboard */}
      <Dashboard />
    </div>
  );
}