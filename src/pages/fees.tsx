"use client";

import React, { useState } from "react";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { DUMMY_FEE_INVOICES } from "@/lib/dummy-data";
import { PrintableFeeReceipt } from "@/components/modules/printable-fee-receipt";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CreditCard, Eye, Plus } from "lucide-react";

export default function FeesPage() {
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(DUMMY_FEE_INVOICES[0]);

  const handleOpenReceipt = (inv: (typeof DUMMY_FEE_INVOICES)[0]) => {
    setSelectedInvoice(inv);
    setIsReceiptOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Fee Management & Ledger</h1>
          <p className="text-xs text-muted-foreground">Manage fee structures, collection invoices, pending balances & official receipts.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Collect Fee / Issue Invoice
        </Button>
      </div>

      <EnterpriseTable
        data={DUMMY_FEE_INVOICES}
        columns={[
          { header: "Invoice No", accessorKey: "invoiceNo", sortable: true },
          { header: "Student Name", accessorKey: "studentName", sortable: true },
          { header: "Class & Sec", cell: (r) => `${r.grade}-${r.section}` },
          { header: "Term", accessorKey: "term" },
          { header: "Total Fee", cell: (r) => formatCurrency(r.totalAmount) },
          { header: "Paid", cell: (r) => <span className="font-bold text-emerald-600">{formatCurrency(r.paidAmount)}</span> },
          { header: "Due Date", accessorKey: "dueDate" },
          { header: "Status", cell: (r) => <StatusChip status={r.status} /> },
          {
            header: "Actions",
            cell: (r) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenReceipt(r)}
                className="h-8 px-2 text-xs text-blue-600 hover:text-blue-800"
              >
                <Eye className="mr-1 h-3.5 w-3.5" /> View Receipt
              </Button>
            ),
          },
        ]}
        statusFilterField="status"
        statusOptions={["Paid", "Pending", "Overdue", "Partial"]}
        exportFilename="school_fee_invoices"
      />

      <PrintableFeeReceipt
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        invoiceNo={selectedInvoice.invoiceNo}
        studentName={selectedInvoice.studentName}
        amount={selectedInvoice.totalAmount}
      />
    </div>
  );
}
