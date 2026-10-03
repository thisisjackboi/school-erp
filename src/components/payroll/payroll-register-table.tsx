import React, { useMemo } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, exportToCSV } from "@/lib/utils";
import { periodLabel } from "@/lib/payroll-fm/helpers";

import type { PayrollRegister } from "@/lib/types/payroll";

interface PayrollRegisterTableProps {
  register: PayrollRegister;
  isLoading?: boolean;
}

/**
 * Department roll-up. The backend groups on designation category, so the
 * grouping column is labelled by category rather than inventing a department.
 */
export function PayrollRegisterTable({
  register,
  isLoading = false,
}: PayrollRegisterTableProps) {
  const groups = register.departments;

  const totals = useMemo(
    () =>
      groups.reduce(
        (acc, group) => ({
          employeeCount: acc.employeeCount + group.employeeCount,
          gross: acc.gross + group.gross,
          deductions: acc.deductions + group.deductions,
          net: acc.net + group.net,
        }),
        { employeeCount: 0, gross: 0, deductions: 0, net: 0 },
      ),
    [groups],
  );

  const handleExport = () => {
    exportToCSV(
      `payroll-register-${register.run.periodYear}-${String(
        register.run.periodMonth,
      ).padStart(2, "0")}`,
      groups.map((group) => ({
        Category: group.category,
        Employees: group.employeeCount,
        Gross: group.gross,
        Deductions: group.deductions,
        Net: group.net,
      })),
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Loading register...
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <p className="text-sm font-semibold">No register data</p>
        <p className="mt-1 text-xs text-muted-foreground">
          This run has no employee lines to summarise.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Salary Register
          </h3>
          <p className="text-xs text-muted-foreground">
            {periodLabel(register.run.periodMonth, register.run.periodYear)}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="h-9 text-xs"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Employees</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net Cost</TableHead>
              <TableHead className="text-right">Share</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {groups.map((group) => {
              const share =
                totals.net > 0 ? Math.round((group.net / totals.net) * 100) : 0;
              return (
                <TableRow key={group.category}>
                  <TableCell className="text-sm font-medium">
                    {group.category}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {group.employeeCount}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {formatCurrency(group.gross)}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-red-600">
                    {formatCurrency(group.deductions)}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums font-semibold">
                    {formatCurrency(group.net)}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                    {share}%
                  </TableCell>
                </TableRow>
              );
            })}

            <TableRow className="bg-slate-50 dark:bg-slate-900/40">
              <TableCell className="text-sm font-bold">Total</TableCell>
              <TableCell className="text-right text-xs font-bold tabular-nums">
                {totals.employeeCount}
              </TableCell>
              <TableCell className="text-right text-xs font-bold tabular-nums">
                {formatCurrency(totals.gross)}
              </TableCell>
              <TableCell className="text-right text-xs font-bold tabular-nums text-red-600">
                {formatCurrency(totals.deductions)}
              </TableCell>
              <TableCell className="text-right text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totals.net)}
              </TableCell>
              <TableCell className="text-right text-xs tabular-nums">100%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}