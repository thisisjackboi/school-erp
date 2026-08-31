"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole, RoleInfo } from "./types";

export const ROLES: RoleInfo[] = [
  {
    id: "administrator",
    name: "Administrator",
    description: "Full system control, configuration & audit logs",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    id: "principal",
    name: "Principal",
    description: "Academic direction, staff analytics & school oversight",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300",
  },
  {
    id: "vice_principal",
    name: "Vice Principal",
    description: "Discipline, substitute allocations & academic monitoring",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300",
  },
  {
    id: "academic_coordinator",
    name: "Academic Coordinator",
    description: "Curriculum mapping, subject syllabi & exam schedules",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300",
  },
  {
    id: "accountant",
    name: "Accountant",
    description: "Fee processing, income, expenses & financial reports",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  {
    id: "hr_manager",
    name: "HR Manager",
    description: "Staff onboarding, payroll, leave requests & attendance",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300",
  },
  {
    id: "teacher",
    name: "Teacher",
    description: "Attendance marking, homework creation & student grading",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300",
  },
  {
    id: "class_teacher",
    name: "Class Teacher",
    description: "Class roster management, report cards & parent alerts",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300",
  },
  {
    id: "librarian",
    name: "Librarian",
    description: "Book checkout, catalog indexing & overdue fines",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    id: "receptionist",
    name: "Receptionist",
    description: "Visitor gate passes, front office inquiries & calls",
    badgeColor: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300",
  },
  {
    id: "transport_manager",
    name: "Transport Manager",
    description: "Bus routes, vehicle logs & driver assignments",
    badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300",
  },
  {
    id: "hostel_warden",
    name: "Hostel Warden",
    description: "Room allocations, resident logs & hostel discipline",
    badgeColor: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300",
  },
  {
    id: "student",
    name: "Student",
    description: "Timetable, homework, exam marks & fee receipts",
    badgeColor: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300",
  },
  {
    id: "parent",
    name: "Parent",
    description: "Child progress tracking, fee payments & announcements",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300",
  },
];

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
}

export const MODULE_ROUTES: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", iconName: "LayoutDashboard" },
  { title: "Access Management", href: "/access-management", iconName: "CalendarDays" },
  { title: "Academic Session", href: "/sessions", iconName: "CalendarDays" },
  { title: "Section Management", href: "/sections", iconName: "layers" },
 
  { title: "Students", href: "/students", iconName: "Users" },
  { title: "Admissions", href: "/admissions", iconName: "UserPlus" },
  { title: "Classes & Sections", href: "/classes", iconName: "School" },
  { title: "Subjects", href: "/subjects", iconName: "BookOpen" },

  { title: "Attendance", href: "/attendance", iconName: "UserCheck" },
  { title: "Homework", href: "/homework", iconName: "FileText" },
  { title: "Timetable", href: "/timetable", iconName: "Clock" },
  { title: "Examinations", href: "/exams", iconName: "GraduationCap" },
  { title: "Report Cards", href: "/report-cards", iconName: "Award" },
  { title: "Fee Management", href: "/fees", iconName: "CreditCard" },
  { title: "Finance & Accounts", href: "/finance", iconName: "DollarSign" },
  { title: "Payroll", href: "/payroll", iconName: "Receipt" },
  { title: "Teachers", href: "/teachers", iconName: "UserSquare2" },
  { title: "Staff Directory", href: "/employees", iconName: "Briefcase" },
  { title: "Leave Management", href: "/leave", iconName: "CalendarCheck" },
  { title: "Library", href: "/library", iconName: "Library" },
  { title: "Inventory", href: "/inventory", iconName: "Boxes" },
  { title: "Transport", href: "/transport", iconName: "Bus" },
  { title: "Hostel", href: "/hostel", iconName: "Building2" },
  { title: "Visitors & Front Office", href: "/visitors", iconName: "UserSearch" },
  { title: "Announcements", href: "/announcements", iconName: "Megaphone" },
  { title: "Events & Calendar", href: "/events", iconName: "Calendar" },
  { title: "Certificates", href: "/certificates", iconName: "FileCheck" },
  { title: "Reports & Analytics", href: "/reports", iconName: "BarChart3" },
  { title: "School Settings", href: "/settings", iconName: "Settings" },
];

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  administrator: MODULE_ROUTES.map((m) => m.href), // Full Access

  principal: [
    "/dashboard",
    "/students",
    "/admissions",
    "/classes",
    "/subjects",
    "/sessions",
    "/attendance",
    "/timetable",
    "/exams",
    "/report-cards",
    "/fees",
    "/finance",
    "/teachers",
    "/employees",
    "/leave",
    "/announcements",
    "/events",
    "/reports",
    "/settings",
  ],

  vice_principal: [
    "/dashboard",
    "/students",
    "/classes",
    "/subjects",
    "/attendance",
    "/homework",
    "/timetable",
    "/exams",
    "/report-cards",
    "/teachers",
    "/leave",
    "/visitors",
    "/announcements",
    "/events",
  ],

  academic_coordinator: [
    "/dashboard",
    "/students",
    "/classes",
    "/subjects",
    "/sessions",
    "/homework",
    "/timetable",
    "/exams",
    "/report-cards",
    "/teachers",
    "/announcements",
    "/events",
  ],

  accountant: [
    "/dashboard",
    "/students",
    "/fees",
    "/finance",
    "/payroll",
    "/reports",
    "/announcements",
  ],

  hr_manager: [
    "/dashboard",
    "/teachers",
    "/employees",
    "/payroll",
    "/leave",
    "/announcements",
    "/reports",
  ],

  teacher: [
    "/dashboard",
    "/students",
    "/attendance",
    "/homework",
    "/timetable",
    "/exams",
    "/report-cards",
    "/leave",
    "/announcements",
    "/events",
  ],

  class_teacher: [
    "/dashboard",
    "/students",
    "/classes",
    "/attendance",
    "/homework",
    "/timetable",
    "/exams",
    "/report-cards",
    "/leave",
    "/announcements",
    "/events",
  ],

  librarian: ["/dashboard", "/students", "/teachers", "/library", "/announcements"],

  receptionist: [
    "/dashboard",
    "/students",
    "/admissions",
    "/visitors",
    "/announcements",
    "/events",
  ],

  transport_manager: [
    "/dashboard",
    "/students",
    "/transport",
    "/announcements",
  ],

  hostel_warden: ["/dashboard", "/students", "/hostel", "/announcements"],

  student: [
    "/dashboard",
    "/attendance",
    "/homework",
    "/timetable",
    "/exams",
    "/report-cards",
    "/fees",
    "/library",
    "/announcements",
    "/events",
  ],

  parent: [
    "/dashboard",
    "/attendance",
    "/homework",
    "/timetable",
    "/exams",
    "/report-cards",
    "/fees",
    "/announcements",
    "/events",
  ],
};

interface RoleContextType {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  allowedRoutes: string[];
  hasPermission: (href: string) => boolean;
  roleDetails: RoleInfo;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeRole, setActiveRoleState] = useState<UserRole>("administrator");

  useEffect(() => {
    const saved = localStorage.getItem("active_erp_role");
    if (saved && ROLES.some((r) => r.id === saved)) {
      setActiveRoleState(saved as UserRole);
    }
  }, []);

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    localStorage.setItem("active_erp_role", role);
  };

  const allowedRoutes = ROLE_PERMISSIONS[activeRole] || [];

  const hasPermission = (href: string) => {
    if (href === "/") return true;
    return allowedRoutes.includes(href);
  };

  const roleDetails =
    ROLES.find((r) => r.id === activeRole) || ROLES[0];

  return (
    <RoleContext.Provider
      value={{
        activeRole,
        setActiveRole,
        allowedRoutes,
        hasPermission,
        roleDetails,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};
