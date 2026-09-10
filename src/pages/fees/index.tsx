import React from "react";
import { Outlet } from "react-router-dom";
import { Loader2, BadgeIndianRupee } from "lucide-react";
import { FeeModuleProvider, useFees } from "@/lib/fees-fm/store";
import { useFeeAccess } from "@/lib/fees-fm/access";
import { ModuleNav } from "@/components/fees/module-nav";
import { cn } from "@/lib/utils";

function FeeModuleShell() {
  const { loading, reloading, session } = useFees();
  const { role, canManage } = useFeeAccess();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Fee & Financial Management</h1>
          <p className="text-xs text-muted-foreground mt-1">Fee setup, collections, invoices & reports</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-muted-foreground">Loading fee module...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
            <BadgeIndianRupee className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Fee & Financial Management</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Class-wise fee assignment · monthly invoices · collections · reports
              {session && <span className="text-blue-600 dark:text-blue-400 font-medium"> · {session.name}</span>}
            </p>
          </div>
        </div>
      </div>

      {reloading && (
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Refreshing reference data…
        </div>
      )}

      {/* Role banner */}
      <div className={cn("rounded-md border px-3 py-2 text-xs", canManage
        ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
        : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200")}>
        {canManage
          ? "Admin / Accountant — assign class fees, generate invoices, collect payments, apply discounts and export reports."
          : role === "parent"
            ? "Viewing as Parent — you can view your child's fee details and pay any outstanding amount."
            : "Viewing as Staff (read-only) — you can view fee status but cannot modify or collect fees."}
      </div>

      <ModuleNav />

      <Outlet />
    </div>
  );
}

export default function FeesModulePage() {
  return (
    <FeeModuleProvider>
      <FeeModuleShell />
    </FeeModuleProvider>
  );
}