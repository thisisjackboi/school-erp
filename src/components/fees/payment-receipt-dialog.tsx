"use client";

import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { formatCurrency, amountInWords } from "@/lib/utils";
import { SCHOOL_NAME, ACADEMIC_YEAR } from "@/lib/school";
import type { InvoiceRow, Payment, StudentInfo } from "@/lib/fees-fm/types";

interface PaymentReceiptDialogProps {
  payment: Payment | null;
  student?: StudentInfo;
  invoices: InvoiceRow[];
  onClose: () => void;
}

function formatDate(d?: string): string {
  if (!d) return "-";
  const dt = new Date(`${d}T00:00:00`);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function humanMode(mode: string) {
  return mode.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PaymentReceiptDialog({
  payment,
  student,
  invoices,
  onClose,
}: PaymentReceiptDialogProps) {
  if (!payment) return null;

  const rows = payment.allocations.map((a) => {
    const inv = invoices.find((r) => r.id === a.invoiceId);
    return {
      label: inv ? `${inv.categoryLabel} · ${inv.periodLabel}` : a.invoiceId,
      discount: inv?.discountAmount ?? 0,
      fine: inv?.fineAmount ?? 0,
      paid: a.amount,
    };
  });

  const totalDiscount = rows.reduce((s, r) => s + (r.discount || 0), 0);
  const totalFine = rows.reduce((s, r) => s + (r.fine || 0), 0);

  return (
    <Dialog open={!!payment} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogHeader className="no-print">
        <div className="flex items-center justify-between gap-3">
          <DialogTitle>Payment Receipt</DialogTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 text-xs">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download / Print
            </Button>
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              <X className="mr-1.5 h-3.5 w-3.5" /> Close
            </Button>
          </div>
        </div>
      </DialogHeader>

      <div
        id="printable-area"
        className="receipt-paper [print-color-adjust:exact] [-webkit-print-color-adjust:exact] max-h-[70vh] overflow-y-auto border-2 border-yellow-700 text-yellow-950 bg-yellow-100 rounded-lg font-sans"
      >
        {/* School header band */}
        <div className="border-b-4 border-double border-yellow-700 bg-yellow-400 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight uppercase">{SCHOOL_NAME}</h2>
            <p className="text-[11px] font-semibold text-yellow-900/80">
              Affiliated • Academic Year {ACADEMIC_YEAR}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block bg-yellow-950 text-yellow-100 text-xs font-black tracking-widest px-3 py-1.5 rounded-sm uppercase">
              Official Receipt
            </span>
            <p className="mt-1.5 text-[11px] font-bold font-mono">
              Receipt No: {payment.receiptNumber}
            </p>
          </div>
        </div>

        {/* Student & payer block */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 px-5 py-3 text-[12px] border-b border-dashed border-yellow-700">
          <p>
            <span className="font-semibold text-yellow-900/70">Student:</span>{" "}
            <strong>{student ? `${student.firstName} ${student.lastName}` : "-"}</strong>
          </p>
          <p>
            <span className="font-semibold text-yellow-900/70">Admission No:</span>{" "}
            <strong>{student?.admissionNumber || "-"}</strong>
          </p>
          <p>
            <span className="font-semibold text-yellow-900/70">Class & Section:</span>{" "}
            <strong>{student ? `${student.className}-${student.sectionName}` : "-"}</strong>
          </p>
          <p>
            <span className="font-semibold text-yellow-900/70">Roll No:</span>{" "}
            <strong>{student?.rollNumber || "-"}</strong>
          </p>
          <p>
            <span className="font-semibold text-yellow-900/70">Guardian:</span>{" "}
            <strong>{student?.parentName || "-"}</strong>
          </p>
          <p>
            <span className="font-semibold text-yellow-900/70">Guardian Phone:</span>{" "}
            <strong>{student?.parentPhone || "-"}</strong>
          </p>
        </div>

        {/* Fee breakdown */}
        <div className="px-5 py-3">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="bg-yellow-200/80 text-yellow-950">
                <th className="p-2 border border-yellow-700 font-bold">Fee Head / Period</th>
                <th className="p-2 border border-yellow-700 font-bold">Discount</th>
                <th className="p-2 border border-yellow-700 font-bold">Fine</th>
                <th className="p-2 border border-yellow-700 font-bold">Paid (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-yellow-700/60">
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="p-2 border border-yellow-700/60">{r.label}</td>
                  <td className="p-2 border border-yellow-700/60 text-right tabular-nums text-blue-800">
                    {r.discount > 0 ? `-${formatCurrency(r.discount)}` : "-"}
                  </td>
                  <td className="p-2 border border-yellow-700/60 text-right tabular-nums text-red-700">
                    {r.fine > 0 ? `+${formatCurrency(r.fine)}` : "-"}
                  </td>
                  <td className="p-2 border border-yellow-700/60 text-right font-semibold tabular-nums">
                    {formatCurrency(r.paid)}
                  </td>
                </tr>
              ))}
              <tr className="bg-yellow-200/60 font-bold">
                <td className="p-2 border border-yellow-700">Totals</td>
                <td className="p-2 border border-yellow-700 text-right tabular-nums text-blue-800">
                  {totalDiscount > 0 ? `-${formatCurrency(totalDiscount)}` : "-"}
                </td>
                <td className="p-2 border border-yellow-700 text-right tabular-nums text-red-700">
                  {totalFine > 0 ? `+${formatCurrency(totalFine)}` : "-"}
                </td>
                <td className="p-2 border border-yellow-700 text-right tabular-nums">
                  {formatCurrency(payment.amount)}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-[11px] italic font-medium">
            Amount in words: {amountInWords(payment.amount)}
          </p>
        </div>

        {/* Payment metadata */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 px-5 pb-3 text-[12px] border-t border-dashed border-yellow-700 pt-3">
          <p>
            <span className="font-semibold text-yellow-900/70">Payment Date:</span>{" "}
            <strong>{formatDate(payment.paymentDate)}</strong>
          </p>
          <p>
            <span className="font-semibold text-yellow-900/70">Payment Mode:</span>{" "}
            <strong>{humanMode(payment.paymentMode)}</strong>
          </p>
          <p>
            <span className="font-semibold text-yellow-900/70">Received By:</span>{" "}
            <strong>{payment.receivedBy}</strong>
          </p>
          <p>
            <span className="font-semibold text-yellow-900/70">Receipt No:</span>{" "}
            <strong className="font-mono">{payment.receiptNumber}</strong>
          </p>
          {payment.referenceNumber && (
            <p>
              <span className="font-semibold text-yellow-900/70">Reference No:</span>{" "}
              <strong>{payment.referenceNumber}</strong>
            </p>
          )}
          {payment.remarks && (
            <p>
              <span className="font-semibold text-yellow-900/70">Remarks:</span>{" "}
              <strong>{payment.remarks}</strong>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between px-5 py-3 border-t-4 border-double border-yellow-700 bg-yellow-200/60 text-[10px] text-yellow-900/80">
          <p>Computer generated receipt. No physical signature required.</p>
          <div className="text-right">
            <p className="font-bold text-yellow-950">Accounts Department</p>
            <p>{SCHOOL_NAME}</p>
          </div>
        </div>
      </div>
    </Dialog>
  );
}