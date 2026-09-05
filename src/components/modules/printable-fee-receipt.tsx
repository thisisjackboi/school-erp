"use client";

import React from "react";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, CreditCard, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PrintableFeeReceiptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNo?: string;
  studentName?: string;
  amount?: number;
}

export function PrintableFeeReceipt({
  open,
  onOpenChange,
  invoiceNo = "INV-2026-001",
  studentName = "Aarav Sharma",
  amount = 45000,
}: PrintableFeeReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="no-print">
        <DialogTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-emerald-600" />
            <span>Official Fee Payment Receipt</span>
          </span>
          <Button size="sm" onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700">
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print Receipt
          </Button>
        </DialogTitle>
      </DialogHeader>

      <div id="printable-area" className="p-6 bg-white dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-slate-100 font-sans space-y-5">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-base font-bold text-blue-900 dark:text-blue-300">PrismaEd+ School</h2>
            <p className="text-xs text-slate-500">Official Fee Receipt • Academic Year 2026-27</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded border border-emerald-300">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" /> PAID
            </span>
            <p className="text-xs text-slate-500 mt-1 font-mono">{invoiceNo}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded border">
          <div>
            <p><span className="text-slate-500">Student Name:</span> <strong>{studentName}</strong></p>
            <p><span className="text-slate-500">Admission No:</span> ADM-2024-001</p>
            <p><span className="text-slate-500">Class & Section:</span> Grade 10-A</p>
          </div>
          <div>
            <p><span className="text-slate-500">Payment Date:</span> July 10, 2026</p>
            <p><span className="text-slate-500">Payment Mode:</span> UPI / Online Portal</p>
            <p><span className="text-slate-500">Term Fee:</span> Term 1 (Apr - Sep 2026)</p>
          </div>
        </div>

        <div className="border rounded overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 font-semibold border-b">
              <tr>
                <th className="p-2 border-r">Fee Component</th>
                <th className="p-2 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr><td className="p-2 border-r">Tuition Fee (Term 1)</td><td className="p-2 text-right">₹ 30,000</td></tr>
              <tr><td className="p-2 border-r">Computer & Science Lab Fee</td><td className="p-2 text-right">₹ 8,000</td></tr>
              <tr><td className="p-2 border-r">Sports & Co-Curricular Fee</td><td className="p-2 text-right">₹ 4,000</td></tr>
              <tr><td className="p-2 border-r">Development & Library Fund</td><td className="p-2 text-right">₹ 3,000</td></tr>
              <tr className="bg-slate-50 dark:bg-slate-800 font-bold">
                <td className="p-2 border-r">Total Amount Paid</td>
                <td className="p-2 text-right text-emerald-600 font-bold">{formatCurrency(amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pt-6 flex justify-between text-xs text-slate-500 border-t">
          <div>
            <p>Computer generated receipt. No physical signature required.</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-slate-800 dark:text-slate-200">Accounts Department</p>
            <p className="text-[10px]">PrismaEd+ School</p>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
