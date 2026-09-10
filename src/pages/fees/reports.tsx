import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  Printer,
  Plus,
  BarChart3,
  AlertTriangle,
  Landmark,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useFees, useFeeFiltersState } from "@/lib/fees-fm/store";
import { useFeeAccess } from "@/lib/fees-fm/access";
import { FeeStatusBadge } from "@/components/fees/fee-status-badge";
import { FilterBar } from "@/components/fees/filter-bar";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { uid } from "@/lib/fees-fm/seed";

function formatDate(d?: string): string {
  if (!d) return "-";
  const dt = new Date(`${d}T00:00:00`);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function humanMode(mode: string) {
  return (mode || "").replace(/_/g, " ");
}

function download(name: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}

export default function FeeReportsPage() {
  const { dashboardStats, defaulters, studentSummaries, state, addExpense, categories } = useFees();
  const { canManage } = useFeeAccess();
  const { toast } = useToast();
  const filters = useFeeFiltersState();

  const stats = useMemo(
    () =>
      dashboardStats({
        className: filters.className || undefined,
        feeCategoryId: filters.feeCategoryId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      }),
    [dashboardStats, filters],
  );

  const defaulterRows = useMemo(
    () => defaulters({ className: filters.className || undefined }),
    [defaulters, filters.className],
  );

  const expenses = useMemo(() => {
    let list = state.expenses;
    if (filters.from) list = list.filter((e) => e.date >= filters.from!);
    if (filters.to) list = list.filter((e) => e.date <= filters.to!);
    return list.slice().sort((a, b) => b.date.localeCompare(a.date));
  }, [state.expenses, filters.from, filters.to]);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expForm, setExpForm] = useState({ category: "Salary", title: "", amount: "", paidTo: "" });

  const handleAddExpense = () => {
    if (!Number(expForm.amount) || !expForm.title.trim()) {
      toast("Error", "Title and amount are required.", "error");
      return;
    }
    const date = filters.to && filters.to >= filters.from ? filters.to : new Date().toISOString().slice(0, 10);
    addExpense({
      id: uid("exp"),
      category: expForm.category,
      title: expForm.title.trim(),
      amount: Number(expForm.amount),
      paidTo: expForm.paidTo,
      paymentMode: "BANK_TRANSFER",
      date,
    });
    toast("Expense recorded", `${expForm.title} added to the financial register.`, "success");
    setExpenseOpen(false);
    setExpForm({ category: "Salary", title: "", amount: "", paidTo: "" });
  };

  const exportAll = () => {
    download(`fees-report-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(
      ["Student", "Admission", "Class", "Status", "Total Due", "Paid", "Balance", "Overdue", "Last Paid"],
      studentSummaries.map((s) => [s.studentName, s.admissionNumber, `${s.className}-${s.sectionName}`, s.status, s.totalDue, s.paid, s.balance, s.overdueAmount, s.lastPaymentDate || "-"]),
    ), "text/csv;charset=utf-8;");
    toast("Exported", "Full CSV export downloaded.", "success");
  };

  const exportDefaulters = () => {
    download(`defaulters-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(
      ["Student", "Admission", "Class", "Overdue Invoices", "Overdue Amount", "Balance", "Last Paid"],
      defaulterRows.map((d) => [d.studentName, d.admissionNumber, `${d.className}-${d.sectionName}`, d.overdueCount, d.overdueAmount, d.balance, d.lastPaymentDate || "-"]),
    ), "text/csv;charset=utf-8;");
    toast("Exported", "Defaulter CSV downloaded.", "success");
  };

  const classRows = useMemo(() => {
    const map = new Map<string, { students: number; collected: number; total: number }>();
    for (const s of studentSummaries) {
      const cur = map.get(s.className) || { students: 0, collected: 0, total: 0 };
      cur.students += 1;
      cur.total += s.totalDue;
      cur.collected += s.paid;
      map.set(s.className, cur);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ ...v, name, rate: v.total > 0 ? (v.collected / v.total) * 100 : 100 }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [studentSummaries]);

  const netIncome = stats.totalCollected - totalExpenses;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Card className="flex-1 min-w-[200px]">
          <CardContent className="p-3 flex items-center gap-3 text-xs">
            <Landmark className="h-8 w-8 p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" />
            <div>
              <p className="text-muted-foreground">Net intake (collected − expenses)</p>
              <p className="text-lg font-bold">{formatCurrency(netIncome)}</p>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={exportDefaulters} disabled={defaulterRows.length === 0}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Defaulters CSV
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={exportAll}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export All
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <FilterBar filters={filters} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Defaulter report */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" /> Defaulters ({defaulterRows.length})
            </CardTitle>
            <span className="text-xs text-red-600 font-semibold">{formatCurrency(defaulterRows.reduce((s, d) => s + d.overdueAmount, 0))}</span>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Invoices</TableHead>
                  <TableHead className="text-right">Overdue</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defaulterRows.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No defaulters 🎉</TableCell></TableRow>
                ) : (
                  defaulterRows.map((d) => (
                    <TableRow key={d.enrollmentId}>
                      <TableCell className="text-xs">
                        <Link to={`/fees/students/${d.enrollmentId}`} className="font-semibold hover:text-blue-600">{d.studentName}</Link>
                        <span className="text-muted-foreground block text-[10px]">{d.className}-{d.sectionName}</span>
                      </TableCell>
                      <TableCell className="text-xs text-center text-red-600 font-semibold">{d.overdueCount}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums font-semibold text-red-600">{formatCurrency(d.overdueAmount)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{formatCurrency(d.balance)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Class-wise collection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" /> Class-wise collection
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {classRows.map((c) => (
              <div key={c.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatCurrency(c.collected)} / {formatCurrency(c.total)} · <strong>{c.rate.toFixed(1)}%</strong>
                  </span>
                </div>
                <div className="h-1.5 w-full rounded bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-1.5 rounded transition-all" style={{ width: `${c.rate}%`, backgroundColor: c.rate > 90 ? "#10b981" : c.rate > 60 ? "#f59e0b" : "#f43f5e" }} />
                </div>
                <p className="text-[10px] text-muted-foreground">{c.students} student(s)</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Category-wise breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" /> Collection by fee head
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fee Head</TableHead>
                <TableHead className="text-right">Total Due</TableHead>
                <TableHead className="text-right">Collected</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.collectedByCategory.map((c) => (
                <TableRow key={c.code}>
                  <TableCell className="text-xs font-medium">{c.name}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{formatCurrency(c.total)}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums text-emerald-600">{formatCurrency(c.collected)}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{formatCurrency(c.total - c.collected)}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums font-semibold">{c.total > 0 ? ((c.collected / c.total) * 100).toFixed(1) : "0"}%</TableCell>
                </TableRow>
              ))}
              {stats.collectedByCategory.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No data in this filter range.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold">Financial Register — Expenses ({expenses.length})</CardTitle>
          {canManage && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs" onClick={() => setExpenseOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Expense
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Paid To</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No expenses recorded.</TableCell></TableRow>
              ) : (
                expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs">{formatDate(e.date)}</TableCell>
                    <TableCell className="text-xs"><span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold">{e.category}</span></TableCell>
                    <TableCell className="text-xs font-medium">{e.title}</TableCell>
                    <TableCell className="text-xs">{e.paidTo}</TableCell>
                    <TableCell className="text-xs">{humanMode(e.paymentMode)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums font-semibold text-red-600">{formatCurrency(e.amount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="p-3 border-t text-xs flex justify-between">
            <span className="text-muted-foreground">Total expenses in range</span>
            <strong className="text-red-600 tabular-nums">{formatCurrency(totalExpenses)}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Add expense dialog */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
          <DialogDescription>Record cash-out on the financial register.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Category</label>
              <select value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                {["Salary", "Transport", "Infrastructure", "Maintenance", "Utilities", "Events", "Other"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Amount</label>
              <Input type="number" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Title</label>
            <Input value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })} placeholder="e.g. Driver salary June" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Paid to</label>
            <Input value={expForm.paidTo} onChange={(e) => setExpForm({ ...expForm, paidTo: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t border-border mt-4">
          <Button variant="outline" onClick={() => setExpenseOpen(false)} className="text-xs">Cancel</Button>
          <Button onClick={handleAddExpense} className="bg-blue-600 hover:bg-blue-700 text-xs">Record expense</Button>
        </div>
      </Dialog>
    </div>
  );
}