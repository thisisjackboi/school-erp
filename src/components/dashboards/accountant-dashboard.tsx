"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MetricCard } from "@/components/enterprise/metric-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import { getDashboard } from "@/lib/api/dashboard.api";
import { formatDisplayDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import type { AccountantDashboard } from "@/lib/types/dashboard";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Landmark,
  AlertCircle,
  FileText,
  Receipt,
  Percent,
  Newspaper,
  Plus,
} from "lucide-react";

export function AccountantDashboard() {
  const { accessToken } = useAuth();

  const [dashboard, setDashboard] = useState<AccountantDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getDashboard<AccountantDashboard>(accessToken);
        if (!cancelled) setDashboard(data);
      } catch {
        if (!cancelled) setDashboard(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const summary = dashboard?.summary;

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Collections"
          value={loading ? "..." : formatCurrency(summary?.todayCollections ?? 0)}
          change={dashboard?.profile.employeeCode ?? ""}
          trend="neutral"
          subtitle="Fee receipts collected today"
          icon={Wallet}
          iconBg="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
        />
        <MetricCard
          title="Month Collections"
          value={loading ? "..." : formatCurrency(summary?.monthCollections ?? 0)}
          change={`Session: ${dashboard?.currentSession?.name ?? "—"}`}
          trend="neutral"
          subtitle="This month fee intake"
          icon={Landmark}
          iconBg="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
        />
        <MetricCard
          title="Outstanding Fees"
          value={loading ? "..." : formatCurrency(summary?.outstandingBalance ?? 0)}
          change={`${summary?.overdueCount ?? 0} overdue invoice${(summary?.overdueCount ?? 0) !== 1 ? "s" : ""}`}
          trend={summary && summary.outstandingBalance > 0 ? "down" : "neutral"}
          subtitle={`${summary?.defaultersCount ?? 0} defaulter${(summary?.defaultersCount ?? 0) !== 1 ? "s" : ""} tracked`}
          icon={AlertCircle}
          iconBg="bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
        />
        <MetricCard
          title="Net Cash Position"
          value={loading ? "..." : formatCurrency(summary?.netCash ?? 0)}
          change={`Expenses: ${formatCurrency(summary?.monthExpense ?? 0)}`}
          trend={summary && summary.netCash >= 0 ? "up" : "down"}
          subtitle={`Income: ${formatCurrency(summary?.monthIncome ?? 0)}`}
          icon={TrendingUp}
          iconBg="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Collections */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Recent Collections</span>
              <Link to="/fees/collect">
                <Button size="sm" className="h-7 text-xs bg-blue-600">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Collect Fee
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {loading ? (
              <p className="text-muted-foreground text-center py-6">
                Loading collections...
              </p>
            ) : (dashboard?.recentCollections ?? []).length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                No fee collections recorded yet.
              </p>
            ) : (
              (dashboard?.recentCollections ?? []).map((collection) => (
                <div
                  key={collection.id}
                  className="p-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Receipt className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {collection.studentName}
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            • {collection.className}-{collection.sectionName}
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          {collection.receiptNumber} • {collection.paymentMethod}
                          {" • "}
                          {formatDisplayDate(collection.paymentDate)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">
                      {formatCurrency(collection.totalAmount)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Recent Expenses</span>
              <Link to="/fees/reports">
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Financial Register
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {loading ? (
              <p className="text-muted-foreground text-center py-6">
                Loading expenses...
              </p>
            ) : (dashboard?.recentExpenses ?? []).length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                No expenses recorded yet.
              </p>
            ) : (
              (dashboard?.recentExpenses ?? []).map((expense) => (
                <div
                  key={expense.id}
                  className="p-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TrendingDown className="h-4 w-4 text-red-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {expense.category}
                        </p>
                        <p className="text-muted-foreground">
                          {expense.paidTo ?? "—"}
                          {" • "}
                          {formatDisplayDate(expense.expenseDate)}
                          {expense.recordedBy ? ` • ${expense.recordedBy}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {formatCurrency(expense.amount)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Recent Notices</span>
              <Newspaper className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {loading ? (
              <p className="text-muted-foreground text-center py-6">
                Loading notices...
              </p>
            ) : (dashboard?.notices ?? []).length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                No notices published yet.
              </p>
            ) : (
              (dashboard?.notices ?? []).map((notice) => (
                <div
                  key={notice.id}
                  className="p-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40"
                >
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    {notice.title}
                  </p>
                  <p className="text-muted-foreground mt-1 line-clamp-2">
                    {notice.body}
                  </p>
                  <p className="text-muted-foreground mt-1.5">
                    {formatDisplayDate(notice.publishedAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <Link to="/fees/collect" className="block">
              <div className="p-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Collect Fee & Issue Receipt
                    </p>
                    <p className="text-muted-foreground">
                      Record a payment for a student
                    </p>
                  </div>
                </div>
              </div>
            </Link>
            <Link to="/fees/dashboard" className="block">
              <div className="p-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Landmark className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Fee Dashboard
                    </p>
                    <p className="text-muted-foreground">
                      Collection trends and fee health
                    </p>
                  </div>
                </div>
              </div>
            </Link>
            <Link to="/fees/students" className="block">
              <div className="p-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Percent className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Discounts & Defaulters
                    </p>
                    <p className="text-muted-foreground">
                      Manage waivers and follow-ups
                    </p>
                  </div>
                </div>
              </div>
            </Link>
            <Link to="/fees/reports" className="block">
              <div className="p-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Reports & Financial Register
                    </p>
                    <p className="text-muted-foreground">
                      Collection reports and expenses
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}