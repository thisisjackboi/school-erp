import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Users as UsersIcon,
  Receipt,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useFees, useFeeFiltersState } from "@/lib/fees-fm/store";
import { useFeeAccess } from "@/lib/fees-fm/access";
import { StatCard } from "@/components/fees/stat-card";
import { FilterBar } from "@/components/fees/filter-bar";
import { formatCurrency } from "@/lib/utils";

function formatDate(d?: string): string {
  if (!d) return "-";
  const dt = new Date(`${d}T00:00:00`);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function FeeDashboardPage() {
  const { dashboardStats, studentSummaries, students } = useFees();
  const { isParent, isReader } = useFeeAccess();
  const filters = useFeeFiltersState();

  // Parent views only their own child's records
  const scoped = useMemo(() => {
    if (isParent && studentSummaries.length) {
      const mineId = studentSummaries[0].enrollmentId;
      return studentSummaries.filter((s) => s.enrollmentId === mineId);
    }
    return studentSummaries;
  }, [isParent, studentSummaries]);

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

  const breakdown = useMemo(() => {
    const list = scoped.filter((s) => {
      if (filters.className && s.className !== filters.className) return false;
      return true;
    });
    return {
      paid: list.filter((s) => s.status === "PAID").length,
      partial: list.filter((s) => s.status === "PARTIAL").length,
      overdue: list.filter((s) => s.status === "OVERDUE").length,
      none: list.filter((s) => s.status === "NONE").length,
    };
  }, [scoped, filters.className]);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <FilterBar filters={filters} />
        </CardContent>
      </Card>

      {/* Big numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Collected" value={formatCurrency(stats.totalCollected)} sub="across all fee heads" icon={<Wallet className="h-4 w-4" />} tone="emerald" />
        <StatCard label="Total Pending" value={formatCurrency(stats.totalPending)} sub={`of ${formatCurrency(stats.totalDue)} total due`} icon={<TrendingUp className="h-4 w-4" />} tone="amber" />
        <StatCard label="Overdue" value={formatCurrency(stats.totalOverdue)} sub={`${stats.defaulterCount} defaulting students`} icon={<ShieldAlert className="h-4 w-4" />} tone="red" onClick={() => undefined} />
        <StatCard label="Collection Rate" value={`${stats.collectionRate.toFixed(1)}%`} sub={`${stats.paidStudents} paid · ${stats.partialStudents} partial · ${stats.overdueStudents} overdue`} icon={<CheckCircle2 className="h-4 w-4" />} tone="blue" />
      </div>

      {/* Status breakdown strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{breakdown.paid}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Paid</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{breakdown.partial}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Partial</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-950 dark:bg-red-950 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-red-600">{breakdown.overdue}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">Overdue</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-slate-600">{breakdown.none}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">No Fees</p>
        </div>
      </div>

      {/* Monthly collection summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Collections Over Time</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.collectedByMonth.map((m) => (
                  <TableRow key={m.monthKey}>
                    <TableCell className="text-xs font-medium">{m.month}</TableCell>
                    <TableCell className="text-xs text-right text-emerald-600 font-semibold tabular-nums">{formatCurrency(m.collected)}</TableCell>
                    <TableCell className="text-xs text-right text-amber-600 font-semibold tabular-nums">{formatCurrency(m.pending)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Collection by Class</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {stats.collectedByClass.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No data</p>
            )}
            {stats.collectedByClass.map((c) => {
              const pct = c.total > 0 ? (c.collected / c.total) * 100 : 0;
              return (
                <div key={c.name} className="space-y-1 py-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatCurrency(c.collected)} / {formatCurrency(c.total)}
                      <span className="ml-1 font-semibold text-slate-700 dark:text-slate-200">{pct.toFixed(0)}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-1.5 rounded" style={{ width: `${pct}%`, backgroundColor: pct > 90 ? "#10b981" : pct > 60 ? "#f59e0b" : "#f43f5e" }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Category-wise breakdown + recent payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Collection by Fee Head</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {stats.collectedByCategory.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No data</p>
            )}
            {stats.collectedByCategory.map((c) => {
              const pct = c.total > 0 ? (c.collected / c.total) * 100 : 0;
              return (
                <div key={c.code} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatCurrency(c.collected)} / {formatCurrency(c.total)}
                      <span className="ml-1 font-semibold text-slate-700 dark:text-slate-200">{pct.toFixed(0)}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-1.5 rounded transition-all"
                      style={{ width: `${pct}%`, backgroundColor: pct > 90 ? "#10b981" : pct > 60 ? "#f59e0b" : "#f43f5e" }}
                    />
                  </div>
                </div>
              );
            })}
            {!isReader && (
              <Link to="/fees/reports">
                <Button variant="outline" size="sm" className="text-xs w-full mt-2">
                  View detailed reports →
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-600" /> Recent Payment Receipts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Receipt No</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentPayments.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    <div className="flex flex-col items-center gap-2">
                      <UsersIcon className="h-6 w-6 text-slate-300" />
                      No payments yet in this filter range.
                    </div>
                  </TableCell></TableRow>
                ) : (
                  stats.recentPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">
                        <span className="font-semibold">{p.studentName}</span>
                        <span className="text-muted-foreground block text-[10px]">{p.className}</span>
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold text-emerald-600 tabular-nums">{formatCurrency(p.amount)}</TableCell>
                      <TableCell className="text-xs"><span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold">{p.paymentMode.replace(/_/g, " ")}</span></TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.receiptNumber}</TableCell>
                      <TableCell className="text-xs">{formatDate(p.paymentDate)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="p-3 border-t text-xs text-muted-foreground">
              Live records for {students.length} enrolled students
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}