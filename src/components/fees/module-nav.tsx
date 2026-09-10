import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Settings2,
  Users,
  CreditCard,
  FileBarChart,
  ShieldCheck,
} from "lucide-react";
import { useFeeAccess } from "@/lib/fees-fm/access";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/fees/dashboard", label: "Dashboard", icon: LayoutDashboard, anyRole: true },
  { href: "/fees/students", label: "Students & Classes", icon: Users, anyRole: true },
  { href: "/fees/collect", label: "Collect Fee", icon: CreditCard, anyRole: true },
  { href: "/fees/setup", label: "Fee Setup", icon: Settings2, managerOnly: true },
  { href: "/fees/reports", label: "Reports", icon: FileBarChart, anyRole: true },
];

export function ModuleNav() {
  const { canManage } = useFeeAccess();
  const location = useLocation();

  const tabs = TABS.filter((t) => !t.managerOnly || canManage);

  // highlight Collect Fee tab when on a student profile within fee module
  const inProfile = location.pathname.startsWith("/fees/students/");

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="inline-flex h-9 items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-1 overflow-x-auto max-w-full">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isCollectActive =
            t.href === "/fees/students" ? location.pathname.startsWith("/fees/students") : false;
          const active =
            t.href === "/fees/collect" && inProfile ? false : NavLinkActive(t.href, location.pathname) || isCollectActive;
          return (
            <NavLink
              key={t.href}
              to={t.href}
              className={cn(
                "inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap",
                active
                  ? "bg-background text-foreground shadow-sm font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {t.label}
            </NavLink>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        {canManage ? "Admin / Accountant · full control" : "Read-only access"}
      </div>
    </div>
  );
}

function NavLinkActive(href: string, pathname: string): boolean {
  if (href === "/fees") return pathname.startsWith("/fees");
  if (pathname.startsWith(href + "/")) return true;
  return pathname === href;
}