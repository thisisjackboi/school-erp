import type { AuthUserPermission } from "./types/auth";

/**
 * Routes that every authenticated user may access regardless of role.
 */
export const ALWAYS_ALLOWED_ROUTES = ["/dashboard", "/profile"];

/**
 * Maps each protected frontend route to the permission code(s) required to
 * see it / navigate to it. The backend remains the security boundary; this
 * only drives UI visibility.
 */
export const MODULE_PERMISSION_MAP: Record<string, string[]> = {
  "/users": ["users.read"],
  "/permissions": ["permissions.read"],
  "/access-management": ["access.read", "roles.read", "permissions.read"],
  "/roles": ["roles.read"],
  "/designations": ["designations.read"],
  "/employees": ["employees.read"],
  "/sessions": ["academic-sessions.read"],
  "/classes": ["classes.read"],
  "/sections": ["sections.read"],
  "/subjects": ["subjects.read"],
  "/class-subjects": ["class-subjects.read"],
  "/teacher-subject-assignments": ["teacher-subject-assignments.read"],
  "/students": ["students.read"],
  "/admissions": ["admissions.read"],
  "/attendance": ["student-attendance.read"],
  "/timetable": ["timetable-periods.read", "timetable-slots.read"],
  "/exam-types": ["exam-types.read"],
  "/exams": ["exams.read"],
  "/exam-schedules": ["exam-schedules.read"],
  "/marks": ["marks.read"],
  "/marks-entry": ["marks.read"],
  "/results": ["exam-results.read"],
  "/report-cards": ["exam-results.read"],
  "/fees/dashboard": ["fees.reports.read", "fees.categories.read"],
  "/fees/setup": ["fee-structures.read"],
  "/fees/students": ["fees.students.read", "fees.receipts.read"],
  "/fees/collect": ["fees.collect"],
  "/fees/reports": ["fees.reports.read"],
  "/library": ["library.read"],
  "/announcements": ["notices.read"],
};

/**
 * Compute the set of routes the authenticated user may access based purely
 * on their database-backed permissions.
 */
export function getRoutesForPermissions(
  permissions: AuthUserPermission[],
): string[] {
  const allowed = new Set<string>(ALWAYS_ALLOWED_ROUTES);
  const codes = new Set(permissions.map((p) => p.code));

  for (const [route, required] of Object.entries(MODULE_PERMISSION_MAP)) {
    if (required.length === 0) {
      allowed.add(route);
    } else if (required.some((code) => codes.has(code))) {
      allowed.add(route);
    }
  }

  return Array.from(allowed);
}