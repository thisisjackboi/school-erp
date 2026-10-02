import React, { useMemo } from "react";
import { FileText, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { employeeFullName } from "@/lib/payroll-fm/helpers";
import type { PayrollRunItem } from "@/lib/types/payroll";

interface PayrollRunItemsTableProps {
  items: PayrollRunItem[];
  isLoading?: boolean;
  /** Draft runs allow per-employee adjustments. */
  canAdjust?: boolean;
  onAdjust?: (item: PayrollRunItem) => void;
  onViewPayslip?: (item: PayrollRunItem) => void;
}

export function PayrollRunItemsTable({
  items,
  isLoading = false,
  canAdjust = false,
  onAdjust,
  onViewPayslip,
}: PayrollRunItemsTableProps) {
  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => ({
          gross: acc.gross + item.grossAmount,
          deductions: acc.deductions + item.totalDeductions,
          net: acc.net + item.netAmount,
        }),
        { gross: 0, deductions: 0, net: 0 },
      ),
    [items],
  );

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Emp Code</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead className="text-right">Working</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">LOP</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
              <TableHead className="w-[140px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 10 }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-28 text-center text-sm text-muted-foreground">
                  No payroll lines in this run.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">
                    {item.employee?.employeeCode ?? "-"}
                  </TableCell>

                  <TableCell>
                    <p className="text-sm font-medium">
                      {employeeFullName(item.employee)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.employee?.employmentType?.replace(/_/g, " ") ?? "-"}
                    </p>
                  </TableCell>

                  <TableCell className="text-xs">
                    {item.employee?.designation?.title ?? "-"}
                  </TableCell>

                  <TableCell className="text-right text-xs tabular-nums">
                    {item.workingDays}
                  </TableCell>

                  <TableCell className="text-right text-xs tabular-nums font-medium">
                    {item.paidDays}
                  </TableCell>

                  <TableCell
                    className={`text-right text-xs tabular-nums ${
                      item.lopDays > 0
                        ? "text-amber-600 font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.lopDays > 0 ? item.lopDays : "-"}
                  </TableCell>

                  <TableCell className="text-right text-xs tabular-nums">
                    {formatCurrency(item.grossAmount)}
                  </TableCell>

                  <TableCell className="text-right text-xs tabular-nums text-red-600">
                    {formatCurrency(item.totalDeductions)}
                    {item.lopAmount > 0 && (
                      <span className="block text-[10px] text-muted-foreground">
                        incl. LOP {formatCurrency(item.lopAmount)}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-right text-xs tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(item.netAmount)}
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {canAdjust && onAdjust && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onAdjust(item)}
                          className="h-8 text-xs text-blue-600"
                        >
                          <Pencil className="mr-1 h-3 w-3" />
                          Adjust
                        </Button>
                      )}

                      {onViewPayslip && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewPayslip(item)}
                          className="h-8 text-xs text-slate-600"
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          Payslip
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && items.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-6 rounded-lg border border-border bg-slate-50 px-4 py-3 text-xs dark:bg-slate-900/40">
          <span className="text-muted-foreground">
            {items.length} employee(s)
          </span>

          <span className="text-muted-foreground">
            Gross{" "}
            <strong className="ml-1 text-slate-800 dark:text-slate-200">
              {formatCurrency(totals.gross)}
            </strong>
          </span>

          <span className="text-muted-foreground">
            Deductions{" "}
            <strong className="ml-1 text-red-600 dark:text-red-400">
              {formatCurrency(totals.deductions)}
            </strong>
          </span>

          <span className="text-muted-foreground">
            Net{" "}
            <strong className="ml-1 text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totals.net)}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}