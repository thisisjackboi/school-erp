"use client";

import React from "react";
import { useRole } from "@/lib/permissions";
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
import { ShieldCheck } from "lucide-react";

export default function DashboardPage() {
  const { activeRole, roleDetails } = useRole();

  const renderDashboard = () => {
    switch (activeRole) {
      case "administrator":
        return <AdminDashboard />;
      case "principal":
        return <PrincipalDashboard />;
      case "vice_principal":
        return <VicePrincipalDashboard />;
      case "academic_coordinator":
        return <AcademicCoordinatorDashboard />;
      case "accountant":
        return <AccountantDashboard />;
      case "hr_manager":
        return <HRDashboard />;
      case "teacher":
        return <TeacherDashboard />;
      case "class_teacher":
        return <ClassTeacherDashboard />;
      case "librarian":
        return <LibrarianDashboard />;
      case "receptionist":
        return <ReceptionistDashboard />;
      case "transport_manager":
        return <TransportDashboard />;
      case "hostel_warden":
        return <HostelDashboard />;
      case "student":
        return <StudentDashboard />;
      case "parent":
        return <ParentDashboard />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Role Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-slate-900 text-white shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold">Apex School ERP Workspace</h1>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${roleDetails.badgeColor}`}>
              {roleDetails.name} View
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            {roleDetails.description}
          </p>
        </div>
      </div>

      {/* Render Active Role Dashboard */}
      {renderDashboard()}
    </div>
  );
}
