import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Play, Plus, Trash2, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { GeneratePayrollDialog } from "@/components/payroll/generate-payroll-dialog";
import { RunStatusBadge } from "@/components/payroll/run-status-badge";

import { usePayroll } from "@/lib/payroll-fm/store";
import { usePayrollAccess } from "@/lib/payroll-fm/access";
import { formatCurrency } from "@/lib/utils";
import { formatDateTime, periodLabel, yearOptions } from "@/lib/payroll-fm/helpers";
import { MONTH_OPTIONS, RUN_STATUS_OPTIONS } from "@/lib/payroll-fm/types";

import type { PayrollRun, PayrollRunStatus } from "@/lib/types/payroll";

export default function PayrollRunsPage() {
  const { runs, loading, discardRun } = usePayroll();
  const { canProcess } = usePayrollAccess();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  const [monthFilter, setMonthFilter] = useState<string>("ALL");

  const filteredRuns = useMemo(() => {
    const term = search.trim().toLowerCase();

    return runs.filter((run) => {
      if (statusFilter !== "ALL" && run.status !== statusFilter) return false;
      if (yearFilter !== "ALL" && String(run.periodYear) !== yearFilter)
        return false;
      if (monthFilter !== "ALL" && String(run.periodMonth) !== monthFilter)
        return false;
      if (!term) return true;
      return (
        periodLabel(run.periodMonth, run.periodYear).toLowerCase().includes(term) ||
        run.paymentMethod?.toLowerCase().includes(term) ||
        run.paymentReference?.toLowerCase().includes(term) ||
        false
      );
    });
  }, [runs, search, statusFilter, yearFilter, monthFilter]);

  const summary = useMemo(
    () => ({
      net: filteredRuns.reduce((sum, run) => sum + run.totalNet, 0),
      employees: filteredRuns.reduce((sum, run) => sum + run.employeeCount, 0),
    }),
    [filteredRuns],
  );

  const handleDiscard = async (run: PayrollRun) => {
    if (
      !window.confirm(
        `Discard the ${periodLabel(run.periodMonth, run.periodYear)} draft payroll?\n\n` +
          "The run and every line in it will be permanently deleted.",
      )
    ) {
      return;
    }

    setIsDiscarding(run.id);
    try {
      await discardRun(run.id);
      toast("Draft discarded", "The run and all of its lines were deleted.", "success");
    } catch (e) {
      toast(
        "Discard failed",
        e instanceof Error ? e.message : "Failed to discard payroll run",
        "error",
      );
    } finally {
      setIsDiscarding(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Payroll Runs
          </h2>
          <p className="text-xs text-muted-foreground">
            One run per month · draft → processed → approved → paid
          </p>
        </div>

        {canProcess && (
          <Button
            type="button"
            onClick={() => setIsGenerateOpen(true)}
            className="bg-emerald-600 text-xs hover:bg-emerald-700"
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Generate Payroll
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Runs shown</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
              {filteredRuns.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Employee lines</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
              {summary.employees}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Total net pay</p>
            <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary.net)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Awaiting payment</p>
            <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
              {
                filteredRuns.filter((run) => run.status === "APPROVED").length
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-slate-50 p-3 dark:bg-slate-900/40 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search period, payment method or reference..."
          className="h-9 bg-background text-xs sm:max-w-xs"
        />

        <select
          value={yearFilter}
          onChange={(event) => setYearFilter(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
        >
          <option value="ALL">All years</option>
          {yearOptions().map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          value={monthFilter}
          onChange={(event) => setMonthFilter(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
        >
          <option value="ALL">All months</option>
          {MONTH_OPTIONS.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
        >
          <option value="ALL">All statuses</option>
          {RUN_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Runs table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm font-bold">
            <span>Run History</span>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {filteredRuns.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <Plus className="mb-3 h-8 w-8 text-muted-foreground" />
              <h3 className="text-sm font-semibold">No payroll runs found</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {runs.length === 0
                  ? "Generate the first monthly payroll run to get started."
                  : "No runs match the selected filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Employees</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead>Paid via</TableHead>
                    <TableHead>Last updated</TableHead>
                    <TableHead className="w-[150px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="text-sm font-medium">
                        {periodLabel(run.periodMonth, run.periodYear)}
                      </TableCell>

                      <TableCell>
                        <RunStatusBadge status={run.status} />
                      </TableCell>

                      <TableCell className="text-right text-xs tabular-nums">
                        {run.employeeCount}
                      </TableCell>

                      <TableCell className="text-right text-xs tabular-nums">
                        {formatCurrency(run.totalGross)}
                      </TableCell>

                      <TableCell className="text-right text-xs tabular-nums text-red-600">
                        {formatCurrency(run.totalDeductions)}
                      </TableCell>

                      <TableCell className="text-right text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(run.totalNet)}
                      </TableCell>

                      <TableCell className="text-xs">
                        {run.paymentMethod ?? "-"}
                        {run.paymentReference && (
                          <span className="block font-mono text-[10px] text-muted-foreground">
                            {run.paymentReference}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(
                          run.paidAt ?? run.approvedAt ?? run.updatedAt,
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/payroll/runs/${run.id}`)}
                            className="h-8 text-xs text-blue-600"
                          >
                            Open
                            <ChevronRight className="ml-1 h-3.5 w-3.5" />
                          </Button>

                          {canProcess && run.status === "DRAFT" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDiscard(run)}
                              disabled={isDiscarding === run.id}
                              className="h-8 w-8 text-slate-400 hover:text-red-600"
                              title="Discard draft run"
                            >
                              {isDiscarding === run.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <GeneratePayrollDialog
        open={isGenerateOpen}
        onOpenChange={setIsGenerateOpen}
        onGenerated={(result) => navigate(`/payroll/runs/${result.run.id}`)}
      />
    </div>
  );
}