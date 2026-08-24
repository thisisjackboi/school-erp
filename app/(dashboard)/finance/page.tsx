"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/enterprise/metric-card";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FinancePage() {
  const transactions = [
    { id: "TX-101", type: "Income", category: "Tuition Fees", title: "Term 1 Fee Collections", amount: 4500000, date: "2026-08-01", reference: "HDFC-BANK-881" },
    { id: "TX-102", type: "Expense", category: "Staff Salaries", title: "July Faculty & Staff Payroll", amount: 4850000, date: "2026-08-02", reference: "AXIS-PAYROLL-01" },
    { id: "TX-103", type: "Expense", category: "Infrastructure", title: "Science Lab Equipment Purchase", amount: 280000, date: "2026-08-04", reference: "PETTY-CASH-42" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Finance & Accounts Ledger</h1>
          <p className="text-xs text-muted-foreground">Track income, operating expenses, petty cash vouchers & monthly financial summaries.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Record Expense / Voucher
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Total YTD Income" value="₹ 3.85 Cr" change="+14% vs FY25" icon={TrendingUp} iconBg="bg-emerald-50 text-emerald-600" />
        <MetricCard title="Total YTD Expenses" value="₹ 2.12 Cr" change="Within budget limit" icon={TrendingDown} iconBg="bg-red-50 text-red-600" />
        <MetricCard title="Net Operating Balance" value="₹ 1.73 Cr" change="HDFC Main Account" icon={DollarSign} iconBg="bg-blue-50 text-blue-600" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-bold">Recent Financial Transactions</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 font-semibold border-b">
                <tr>
                  <th className="p-3">Reference No</th>
                  <th className="p-3">Title / Description</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="p-3 font-mono">{tx.reference}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{tx.title}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold">{tx.category}</span></td>
                    <td className="p-3">{tx.date}</td>
                    <td className={`p-3 text-right font-bold ${tx.type === "Income" ? "text-emerald-600" : "text-red-600"}`}>
                      {tx.type === "Income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
