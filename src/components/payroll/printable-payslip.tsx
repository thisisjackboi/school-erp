import React from "react";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { amountInWords, formatCurrency } from "@/lib/utils";
import {
  employeeFullName,
  formatDate,
  periodLabel,
} from "@/lib/payroll-fm/helpers";

import { RunStatusBadge } from "./run-status-badge";

import type { PayrollRun, PayrollRunItem } from "@/lib/types/payroll";

interface PayslipDocumentProps {
  item: PayrollRunItem;
  run: PayrollRun;
}

/**
 * The printable payslip itself. `id="printable-area"` hooks into the existing
 * print stylesheet in `index.css`, which hides everything else on `window.print()`.
 */
export function PayslipDocument({ item, run }: PayslipDocumentProps) {
  return (
    <div
      id="printable-area"
      className="space-y-4 rounded-lg border border-border bg-white p-6 text-slate-900"
    >
      <div className="flex items-start justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-blue-900">PrismaEd+ School</h2>
          <p className="text-[11px] text-slate-500">
            Salary Slip · {periodLabel(run.periodMonth, run.periodYear)}
          </p>
        </div>

        <div className="text-right">
          <RunStatusBadge status={run.status} />
          <p className="mt-1 font-mono text-[10px] text-slate-500">
            {run.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 rounded border border-slate-200 bg-slate-50 p-3 text-[11px]">
        <p>
          <span className="text-slate-500">Employee:</span>{" "}
          <strong>{employeeFullName(item.employee)}</strong>
        </p>
        <p>
          <span className="text-slate-500">Emp Code:</span>{" "}
          <strong>{item.employee?.employeeCode ?? "-"}</strong>
        </p>
        <p>
          <span className="text-slate-500">Designation:</span>{" "}
          <strong>{item.employee?.designation?.title ?? "-"}</strong>
        </p>
        <p>
          <span className="text-slate-500">Employment:</span>{" "}
          <strong>
            {item.employee?.employmentType?.replace(/_/g, " ") ?? "-"}
          </strong>
        </p>
        <p>
          <span className="text-slate-500">Working Days:</span>{" "}
          <strong>{item.workingDays}</strong>
        </p>
        <p>
          <span className="text-slate-500">Paid Days:</span>{" "}
          <strong>{item.paidDays}</strong>
        </p>
        <p>
          <span className="text-slate-500">Loss of Pay:</span>{" "}
          <strong>{item.lopDays} day(s)</strong>
        </p>
        <p>
          <span className="text-slate-500">Annual CTC:</span>{" "}
          <strong>{formatCurrency(item.ctc)}</strong>
        </p>
      </div>

      <div className="overflow-hidden rounded border border-slate-200 text-[11px]">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-100 font-semibold">
            <tr>
              <th className="border-r border-slate-200 p-2">Earnings</th>
              <th className="border-r border-slate-200 p-2 text-right">Amount</th>
              <th className="p-2">Deductions</th>
              <th className="p-2 text-right">Amount</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {renderRows(item.earnings, item.deductions)}
          </tbody>
        </table>
      </div>

      <div className="space-y-1 rounded border border-slate-200 p-3 text-[11px]">
        <div className="flex justify-between">
          <span className="text-slate-500">Gross Earnings</span>
          <span className="font-semibold tabular-nums">
            {formatCurrency(item.grossAmount)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">
            Loss of Pay ({item.lopDays} day(s))
          </span>
          <span className="font-semibold tabular-nums text-red-600">
            − {formatCurrency(item.lopAmount)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Other Deductions</span>
          <span className="font-semibold tabular-nums text-red-600">
            − {formatCurrency(
              Math.max(0, item.totalDeductions - item.lopAmount),
            )}
          </span>
        </div>

        <div className="flex justify-between border-t border-slate-200 pt-2">
          <span className="font-bold">Total Deductions</span>
          <span className="font-bold tabular-nums text-red-600">
            {formatCurrency(item.totalDeductions)}
          </span>
        </div>

        <div className="flex justify-between rounded bg-emerald-50 px-2 py-1.5">
          <span className="font-bold text-emerald-800">Net Pay</span>
          <span className="font-bold tabular-nums text-emerald-700">
            {formatCurrency(item.netAmount)}
          </span>
        </div>

        <p className="pt-1 text-[10px] italic text-slate-500">
          {amountInWords(item.netAmount)}
        </p>
      </div>

      <div className="flex items-end justify-between border-t border-slate-200 pt-4 text-[10px] text-slate-500">
        <div>
          <p>Generated on {formatDate(run.createdAt)}</p>
          {run.paymentMethod && (
            <p>
              Paid via {run.paymentMethod}
              {run.paymentReference ? ` · ${run.paymentReference}` : ""}
            </p>
          )}
          {run.paidAt && <p>Paid on {formatDate(run.paidAt)}</p>}
        </div>

        <div className="text-right">
          <p className="font-semibold text-slate-800">Authorised Signatory</p>
          <p>Accounts Department</p>
        </div>
      </div>
    </div>
  );
}

interface PrintablePayslipProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PayrollRunItem;
  run: PayrollRun;
}

export function PrintablePayslip({
  open,
  onOpenChange,
  item,
  run,
}: PrintablePayslipProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="no-print">
        <DialogTitle className="flex items-center justify-between gap-3">
          <span>Salary Slip</span>
          <Button
            type="button"
            size="sm"
            onClick={() => window.print()}
            className="bg-blue-600 text-xs hover:bg-blue-700"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print
          </Button>
        </DialogTitle>
        <DialogDescription>
          Computer generated payslip. Figures are frozen at generation time and
          never recalculated.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4">
        <PayslipDocument item={item} run={run} />
      </div>
    </Dialog>
  );
}

/**
 * Earnings and deductions print side by side; the shorter column is padded with
 * blanks so both lists stay aligned.
 */
function renderRows(
  earnings: PayrollRunItem["earnings"],
  deductions: PayrollRunItem["deductions"],
) {
  const rowCount = Math.max(earnings.length, deductions.length, 1);

  return Array.from({ length: rowCount }).map((_, index) => {
    const earning = earnings[index];
    const deduction = deductions[index];

    return (
      <tr key={index}>
        <td className="border-r border-slate-100 p-2">{earning?.name ?? ""}</td>
        <td className="border-r border-slate-100 p-2 text-right tabular-nums">
          {earning ? formatCurrency(earning.amount) : ""}
        </td>
        <td className="p-2">{deduction?.name ?? ""}</td>
        <td className="p-2 text-right tabular-nums">
          {deduction ? formatCurrency(deduction.amount) : ""}
        </td>
      </tr>
    );
  });
}