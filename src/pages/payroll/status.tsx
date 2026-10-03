import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { listPayrollRunItems } from "@/lib/api/payroll.api";
import { useAuth } from "@/lib/auth/auth-context";
import { usePayroll } from "@/lib/payroll-fm/store";
import { periodLabel, yearOptions } from "@/lib/payroll-fm/helpers";
import { MONTH_OPTIONS } from "@/lib/payroll-fm/types";
import { formatCurrency } from "@/lib/utils";

import type { PayrollRunItem } from "@/lib/types/payroll";

type SalaryState = "PAID" | "PENDING" | "NO_STRUCTURE" | "NOT_IN_RUN" | "NOT_GENERATED";

const STATE_META: Record<
  SalaryState,
  { label: string; variant: "success" | "warning" | "destructive" | "secondary" }
> = {
  PAID: { label: "Paid", variant: "success" },
  PENDING: { label: "Pending", variant: "warning" },
  NO_STRUCTURE: { label: "No salary structure", variant: "destructive" },
  NOT_IN_RUN: { label: "Not in run", variant: "secondary" },
  NOT_GENERATED: { label: "Payroll not generated", variant: "secondary" },
};

export default function PayrollStatusPage() {
  const { runs, employees, missingStructures, loading } = usePayroll();
  const { accessToken } = useAuth();

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [items, setItems] = useState<PayrollRunItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const run = useMemo(
    () => runs.find((entry) => entry.periodMonth === month && entry.periodYear === year) ?? null,
    [runs, month, year],
  );

  useEffect(() => {
    if (!run || !accessToken) {
      setItems([]);
      return;
    }

    let cancelled = false;
    setItemsLoading(true);

    void (async () => {
      try {
        const list = await listPayrollRunItems(run.id, undefined, accessToken);
        if (!cancelled) setItems(list);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setItemsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [run?.id, accessToken]);

  const itemByEmployee = useMemo(() => {
    const map = new Map<string, PayrollRunItem>();
    items.forEach((item) => map.set(item.employeeId, item));
    return map;
  }, [items]);

  const missingIds = useMemo(
    () => new Set(missingStructures.map((entry) => entry.id)),
    [missingStructures],
  );

  const rows = useMemo(() => {
    return employees
      .filter((employee) => employee.status === "ACTIVE" || employee.status === "ON_LEAVE")
      .map((employee) => {
        const item = itemByEmployee.get(employee.id);

        let state: SalaryState;
        if (!run) state = "NOT_GENERATED";
        else if (item) state = run.status === "PAID" ? "PAID" : "PENDING";
        else if (missingIds.has(employee.id)) state = "NO_STRUCTURE";
        else state = "NOT_IN_RUN";

        return { employee, state, net: item?.netAmount ?? null };
      });
  }, [employees, run, itemByEmployee, missingIds]);

  const counts = useMemo(
    () => ({
      total: rows.length,
      paid: rows.filter((row) => row.state === "PAID").length,
      pending: rows.filter((row) => row.state === "PENDING").length,
      unpaid: rows.filter((row) => row.state !== "PAID").length,
      noStructure: rows.filter((row) => row.state === "NO_STRUCTURE").length,
    }),
    [rows],
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Salary Status
        </h2>
        <p className="text-xs text-muted-foreground">
          {periodLabel(month, year)} · salary given employee-wise
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-slate-50 p-3 dark:bg-slate-900/40 sm:flex-row sm:items-center">
        <select
          value={month}
          onChange={(event) => setMonth(Number(event.target.value))}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
        >
          {MONTH_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
        >
          {yearOptions().map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        {run && (
          <span className="text-xs text-muted-foreground">
            Run: {run.employeeCount} employees · {run.totalNet > 0 ? formatCurrency(run.totalNet) : "-"}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Net Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || itemsLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center">
                  <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-xs text-muted-foreground">
                  No active employees found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map(({ employee, state, net }) => {
                const meta = STATE_META[state];
                return (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        {employee.fullName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{employee.employeeCode}</p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {employee.designation?.title ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {net === null ? "-" : formatCurrency(net)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {counts.total} employees · {counts.paid} paid · {counts.pending} pending ·{" "}
        {counts.noStructure} without salary structure
      </p>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Employees without salary structure ({missingStructures.length})
        </h3>

        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Designation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missingStructures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="py-10 text-center text-xs text-muted-foreground">
                    Every active employee has a salary structure.
                  </TableCell>
                </TableRow>
              ) : (
                missingStructures.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        {`${entry.firstName} ${entry.lastName}`.trim() || entry.employeeCode}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{entry.employeeCode}</p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {entry.designation?.title ?? "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
