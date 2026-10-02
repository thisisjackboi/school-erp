import React from "react";
import { Outlet } from "react-router-dom";
import { Loader2, BadgeIndianRupee } from "lucide-react";

import { PayrollModuleProvider, usePayroll } from "@/lib/payroll-fm/store";
import { usePayrollAccess } from "@/lib/payroll-fm/access";
import { cn } from "@/lib/utils";

function PayrollModuleShell() {
  const { loading, error, runs, missingStructures } = usePayroll();
  const { canManage, canRead } = usePayrollAccess();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Payroll Management
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Salary structures, monthly payroll runs & payslips
          </p>
        </div>

        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading payroll module...
          </span>
        </div>
      </div>
    );
  }

  const draftRuns = runs.filter((run) => run.status === "DRAFT").length;
  const payableRuns = runs.filter(
    (run) => run.status === "APPROVED",
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <BadgeIndianRupee className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Payroll Management
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Salary structures · monthly payroll runs · approval · payslips
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {canRead && (
            <>
              <span>
                Drafts{" "}
                <strong className="text-slate-700 dark:text-slate-200">
                  {draftRuns}
                </strong>
              </span>
              <span>
                Awaiting payment{" "}
                <strong className="text-amber-600 dark:text-amber-400">
                  {payableRuns}
                </strong>
              </span>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Failed to load payroll data: {error}
        </div>
      )}

      {!canRead && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          You do not hold the payroll.read permission, so payroll data is not
          shown. Salary setup below may still be available to you.
        </div>
      )}

      <div
        className={cn(
          "rounded-md border px-3 py-2 text-xs",
          canManage
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
            : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
        )}
      >
        {canManage
          ? "Full control — maintain salary components and structures, generate payroll runs, approve them and mark them paid."
          : "Read-only access — you can review payroll runs, registers and payslips but not change them."}
        {missingStructures.length > 0 && (
          <span className="ml-1 font-semibold">
            {missingStructures.length} active employee(s) still have no salary
            structure and will be skipped by payroll.
          </span>
        )}
      </div>

      <Outlet />
    </div>
  );
}

export default function PayrollModulePage() {
  return (
    <PayrollModuleProvider>
      <PayrollModuleShell />
    </PayrollModuleProvider>
  );
}