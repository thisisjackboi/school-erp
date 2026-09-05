import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useRole, NAV_GROUPS, MODULE_ROUTES } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  School,
  BookOpen,
  CalendarDays,
  UserCheck,
  FileText,
  Clock,
  GraduationCap,
  Award,
  CreditCard,
  DollarSign,
  Receipt,
  UserSquare2,
  Briefcase,
  CalendarCheck,
  Library,
  Boxes,
  Bus,
  Building2,
  UserSearch,
  Megaphone,
  Calendar,
  FileCheck,
  BarChart3,
  Settings,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  GraduationCap as SchoolLogo,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  UserPlus,
  School,
  BookOpen,
  CalendarDays,
  UserCheck,
  FileText,
  Clock,
  GraduationCap,
  Award,
  CreditCard,
  DollarSign,
  Receipt,
  UserSquare2,
  Briefcase,
  CalendarCheck,
  Library,
  Boxes,
  Bus,
  Building2,
  UserSearch,
  Megaphone,
  Calendar,
  FileCheck,
  BarChart3,
  Settings,
  ClipboardCheck,
};

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { hasPermission, roleDetails } = useRole();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const visibleRoutes = MODULE_ROUTES.filter((m) => hasPermission(m.href));
  const standaloneRoutes = visibleRoutes.filter((r) => !r.group);
  const groupedRoutes = visibleRoutes.filter((r) => r.group);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  // Auto-open the group containing the currently active route
  useEffect(() => {
    const active = MODULE_ROUTES.find((r) => isActive(r.href));
    if (active?.group) {
      setOpenGroups((prev) =>
        prev.has(active.group as string)
          ? prev
          : new Set(prev).add(active.group as string),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-slate-900 text-slate-100 transition-all duration-200 shrink-0 select-none z-30",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header / Brand */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <Link to="/dashboard" className="flex items-center space-x-3 overflow-hidden">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <SchoolLogo className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight leading-tight">
                PrismaEd+
              </span>
              <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                School ERP Enterprise
              </span>
            </div>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {/* Standalone items (Dashboard, Admissions) */}
        {standaloneRoutes.map((route) => {
          const Icon = ICON_MAP[route.iconName] || LayoutDashboard;
          const active = isActive(route.href);

          return (
            <Link
              key={route.href}
              to={route.href}
              title={collapsed ? route.title : undefined}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-all group",
                active
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
              {!collapsed && <span className="truncate">{route.title}</span>}
            </Link>
          );
        })}

        {/* Grouped dropdowns */}
        {NAV_GROUPS.map((group) => {
          const routes = groupedRoutes.filter((r) => r.group === group.id);
          if (routes.length === 0) return null;

          const GroupIcon = ICON_MAP[group.iconName] || LayoutDashboard;
          const groupActive = routes.some((r) => isActive(r.href));
          const open = openGroups.has(group.id);

          return (
            <div key={group.id} className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  if (collapsed) {
                    setCollapsed(false);
                    setOpenGroups((prev) =>
                      prev.has(group.id)
                        ? prev
                        : new Set(prev).add(group.id),
                    );
                  } else {
                    toggleGroup(group.id);
                  }
                }}
                title={collapsed ? group.title : undefined}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-all w-full group",
                  groupActive
                    ? "text-white font-semibold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <GroupIcon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    groupActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                {!collapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{group.title}</span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200",
                        open && "rotate-180"
                      )}
                    />
                  </>
                )}
              </button>

              {!collapsed && open && (
                <div className="ml-3 space-y-1 border-l border-slate-800 pl-2">
                  {routes.map((route) => {
                    const Icon = ICON_MAP[route.iconName] || LayoutDashboard;
                    const active = isActive(route.href);

                    return (
                      <Link
                        key={route.href}
                        to={route.href}
                        className={cn(
                          "flex items-center space-x-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all group",
                          active
                            ? "bg-blue-600 text-white shadow-sm font-semibold"
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                        )}
                      >
                        <span className="h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
                        <span className="truncate">{route.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer User Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex items-center space-x-3">
        <Avatar fallback={roleDetails.name.substring(0, 2).toUpperCase()} size="sm" />
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-semibold text-white truncate">
              {roleDetails.name} User
            </span>
            <span className="text-[10px] text-blue-400 font-medium truncate">
              {roleDetails.id}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}