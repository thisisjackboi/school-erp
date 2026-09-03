import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/protected-route";

// Import all pages
import LoginPage from "@/pages/login";
import UsersPage from "@/pages/users/index";
import AdmissionsPage from "@/pages/admissions/index";
import DashboardPage from "@/pages/dashboard";
import PermissionsPage from "@/pages/permissions/index";
import StudentsPage from "@/pages/students";

import ClassesPage from "@/pages/classes/index";
import ClassSubjectsPage from "@/pages/class-subjects/index";
import SubjectsPage from "@/pages/subjects/index";
import SessionsPage from "@/pages/sessions/index";
import SectionPage from "@/pages/sections/index";
import AttendancePage from "@/pages/attendance";
import HomeworkPage from "@/pages/homework";
import TimetablePage from "@/pages/timetable";
import ExamsPage from "@/pages/exams";
import ReportCardsPage from "@/pages/report-cards";
import FeesPage from "@/pages/fees";
import FinancePage from "@/pages/finance";
import PayrollPage from "@/pages/payroll";
import TeachersPage from "@/pages/teachers";
import LeavePage from "@/pages/leave";
import LibraryPage from "@/pages/library";
import InventoryPage from "@/pages/inventory";
import TransportPage from "@/pages/transport";
import HostelPage from "@/pages/hostel";
import VisitorsPage from "@/pages/visitors";
import AnnouncementsPage from "@/pages/announcements";
import EventsPage from "@/pages/events";
import CertificatesPage from "@/pages/certificates";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import ProfilePage from "@/pages/profile";
import AccessManagementPage from "@/pages/access-management";
import DesignationsPage from "@/pages/designations/index";
import RolesPage from "./pages/roles/index";
import EmployeesPage from "@/pages/employees/index";
import TeacherSubjectAssignmentsPage from "./pages/teacher-subjectr-assignments";

export function App() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/" element={<LoginPage />} />

      {/* Authenticated Dashboard App Layout & Module Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/users" element={<UsersPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/access-management" element={<AccessManagementPage />} />
          <Route path="/admissions" element={<AdmissionsPage />} />

          <Route path="/permissions" element={<PermissionsPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/designations" element={<DesignationsPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route
            path="/teacher-subject-assignments"
            element={<TeacherSubjectAssignmentsPage />}
          />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/admissions" element={<AdmissionsPage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/class-subjects" element={<ClassSubjectsPage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/sections" element={<SectionPage />} />

          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/homework" element={<HomeworkPage />} />
          <Route path="/timetable" element={<TimetablePage />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="/report-cards" element={<ReportCardsPage />} />
          <Route path="/fees" element={<FeesPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/payroll" element={<PayrollPage />} />
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/leave" element={<LeavePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/transport" element={<TransportPage />} />
          <Route path="/hostel" element={<HostelPage />} />
          <Route path="/visitors" element={<VisitorsPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
