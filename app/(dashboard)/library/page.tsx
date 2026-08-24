"use client";

import React, { useState } from "react";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { DUMMY_LIBRARY_BOOKS, DUMMY_BOOK_CHECKOUTS } from "@/lib/dummy-data";
import { Library, Plus, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<"books" | "checkouts">("books");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Library Catalog & Borrowing System</h1>
          <p className="text-xs text-muted-foreground">Manage book catalog, accession registers, issue/return checkout logs & overdue fines.</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-md border p-1 bg-slate-100 dark:bg-slate-800">
            <button onClick={() => setActiveTab("books")} className={`px-3 py-1 text-xs font-semibold rounded ${activeTab === "books" ? "bg-card shadow" : "text-muted-foreground"}`}>
              Book Catalog
            </button>
            <button onClick={() => setActiveTab("checkouts")} className={`px-3 py-1 text-xs font-semibold rounded ${activeTab === "checkouts" ? "bg-card shadow" : "text-muted-foreground"}`}>
              Checkouts & Fines
            </button>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-xs">
            <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" /> Issue / Return Book
          </Button>
        </div>
      </div>

      {activeTab === "books" ? (
        <EnterpriseTable
          data={DUMMY_LIBRARY_BOOKS}
          columns={[
            { header: "Accession No", accessorKey: "accessionNo", sortable: true },
            { header: "Book Title", accessorKey: "title", sortable: true },
            { header: "Author", accessorKey: "author" },
            { header: "Category", accessorKey: "category" },
            { header: "Rack Location", accessorKey: "rackLocation" },
            { header: "Total Copies", accessorKey: "copiesTotal" },
            { header: "Available Copies", cell: (r) => <span className="font-bold text-emerald-600">{r.copiesAvailable}</span> },
          ]}
        />
      ) : (
        <EnterpriseTable
          data={DUMMY_BOOK_CHECKOUTS}
          columns={[
            { header: "Book Title", accessorKey: "bookTitle" },
            { header: "Borrower Name", accessorKey: "borrowerName" },
            { header: "Role", accessorKey: "borrowerRole" },
            { header: "Issue Date", accessorKey: "issueDate" },
            { header: "Due Date", accessorKey: "dueDate" },
            { header: "Status", cell: (r) => <StatusChip status={r.status} /> },
            { header: "Overdue Fine", cell: (r) => r.fineAmount > 0 ? <span className="font-bold text-red-600">₹ {r.fineAmount}</span> : "₹ 0" },
          ]}
        />
      )}
    </div>
  );
}
