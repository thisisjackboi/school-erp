import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Wallet,
} from "lucide-react";

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
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { PayrollRunItemsTable } from "@/components/payroll/payroll-run-items-table";
import { PayrollRegisterTable } from "@/components/payroll/payroll-register-table";
import { BonusDeductionPanel } from "@/components/payroll/bonus-deduction-panel";
import { PrintablePayslip } from "@/components/payroll/printable-payslip";
import { RunItemAdjustDialog } from "@/components/payroll/run-item-adjust-dialog";
import { RunStatusBadge } from "@/components/payroll/run-status-badge";

import {
  getPayrollAdjustments,
  getPayrollRegister,
  getPayrollRun,
  getPayslip,
} from "@/lib/api/payroll.api";
import { useAuth } from "@/lib/auth/auth-context";
import { usePayroll } from "@/lib/payroll-fm/store";
import { usePayrollAccess } from "@/lib/payroll-fm/access";
import { formatDateTime, periodLabel, toISODate } from "@/lib/payroll-fm/helpers";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payroll-fm/types";
import { formatCurrency } from "@/lib/utils";

import type {
  PayrollAdjustmentRegister,
  PayrollRegister,
  PayrollRun,
  PayrollRunItem,
  PayslipResult,
  UpdatePayrollRunItemPayload,
} from "@/lib/types/payroll";

const EMPTY_ADJUSTMENTS: PayrollAdjustmentRegister = {
  filters: { year: null, month: null },
  availablePeriods: [],
  rows: [],
  totals: { totalBonus: 0, totalDeduction: 0, netEffect: 0 },
};

export default function PayrollRunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const { canProcess, canApprove, canPay } = usePayrollAccess();
  const {
    runs,
    processRun,
    unprocessRun,
    approveRun,
    unapproveRun,
    payRun,
    updateRunItem,
  } = usePayroll();

  const [run, setRun] = useState<PayrollRun | null>(null);
  const [register, setRegister] = useState<PayrollRegister | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegisterLoading, setIsRegisterLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const [adjustItem, setAdjustItem] = useState<PayrollRunItem | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [payslip, setPayslip] = useState<PayslipResult | null>(null);
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHOD_OPTIONS[0]);
  const [paymentReference, setPaymentReference] = useState("");
  const [paidOn, setPaidOn] = useState(toISODate(new Date()));
  const [payNotes, setPayNotes] = useState("");

  const [adjustments, setAdjustments] = useState(EMPTY_ADJUSTMENTS);
  const [isAdjustmentsLoading, setIsAdjustmentsLoading] = useState(true);
  const [adjustYear, setAdjustYear] = useState<number | null>(null);
  const [adjustMonth, setAdjustMonth] = useState<number | null>(null);

  // Bonus and deduction expand independently, so opening a bonus row does not
  // collapse the same employee in the deduction list.
  const [expandedBonusId, setExpandedBonusId] = useState<string | null>(null);
  const [expandedDeductionId, setExpandedDeductionId] = useState<string | null>(
    null,
  );

  // Bumped after a save so the register refetches even when the filters are
  // unchanged.
  const [adjustRefresh, setAdjustRefresh] = useState(0);

  // The store keeps the run list fresh after every action, so mirror the run
  // out of it and fall back to a direct fetch on deep links.
  const runFromStore = useMemo(
    () => runs.find((entry) => entry.id === runId) ?? null,
    [runs, runId],
  );

  const loadRun = useCallback(async () => {
    if (!runId || !accessToken) return;
    const detail = await getPayrollRun(runId, accessToken);
    setRun(detail);
  }, [runId, accessToken]);

  useEffect(() => {
    if (!runId || !accessToken) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const detail = await getPayrollRun(runId, accessToken);
        if (!cancelled) setRun(detail);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load payroll run",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [runId, accessToken]);

  useEffect(() => {
    if (!runId || !accessToken) return;

    let cancelled = false;
    setIsRegisterLoading(true);

    void (async () => {
      try {
        const result = await getPayrollRegister(runId, accessToken);
        if (!cancelled) setRegister(result);
      } catch {
        if (!cancelled) setRegister(null);
      } finally {
        if (!cancelled) setIsRegisterLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [runId, accessToken, runFromStore]);

  // Bonus / deduction register. Every payroll status is included server-side so
  // a draft's figures show up here immediately after saving.
  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setIsAdjustmentsLoading(true);

    void (async () => {
      try {
        const result = await getPayrollAdjustments(
          {
            ...(adjustYear ? { year: adjustYear } : {}),
            ...(adjustMonth ? { month: adjustMonth } : {}),
          },
          accessToken,
        );
        if (!cancelled) setAdjustments(result);
      } catch {
        if (!cancelled) setAdjustments(EMPTY_ADJUSTMENTS);
      } finally {
        if (!cancelled) setIsAdjustmentsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, adjustYear, adjustMonth, adjustRefresh]);

  const handleAdjustSave = async (payload: UpdatePayrollRunItemPayload) => {
    if (!adjustItem || !run) return;

    setIsAdjusting(true);
    try {
      const updated = await updateRunItem(run.id, adjustItem.id, payload);
      if (updated.items) setRun(updated);
      else await loadRun();
      setAdjustRefresh((n) => n + 1);
      toast("Payroll line updated", "Gross and net were recalculated.", "success");
      setAdjustItem(null);
    } catch (e) {
      toast(
        "Update failed",
        e instanceof Error ? e.message : "Failed to update payroll line",
        "error",
      );
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleViewPayslip = async (item: PayrollRunItem) => {
    if (!accessToken) return;
    try {
      const result = await getPayslip(item.id, accessToken);
      setPayslip(result);
      setIsPayslipOpen(true);
    } catch (e) {
      toast(
        "Payslip unavailable",
        e instanceof Error ? e.message : "Failed to fetch payslip",
        "error",
      );
    }
  };

  const handleProcess = async () => {
    if (!run) return;
    setIsWorking(true);
    try {
      const updated = await processRun(run.id);
      if (updated.items) setRun(updated);
      else await loadRun();
      toast(
        "Payroll processed",
        "Lines are now locked. Approve the run to authorise payment.",
        "success",
      );
    } catch (e) {
      toast(
        "Process failed",
        e instanceof Error ? e.message : "Failed to process payroll",
        "error",
      );
    } finally {
      setIsWorking(false);
    }
  };

  const handleApprove = async () => {
    if (!run) return;
    setIsWorking(true);
    try {
      const updated = await approveRun(run.id);
      if (updated.items) setRun(updated);
      else await loadRun();
      toast(
        "Payroll approved",
        "The run is authorised for payment and can no longer be edited.",
        "success",
      );
    } catch (e) {
      toast(
        "Approval failed",
        e instanceof Error ? e.message : "Failed to approve payroll",
        "error",
      );
    } finally {
      setIsWorking(false);
    }
  };

  const handleUnprocess = async () => {
    if (!run) return;
    if (!window.confirm("Revert this run from Processed back to Draft?")) return;
    setIsWorking(true);
    try {
      const updated = await unprocessRun(run.id);
      if (updated.items) setRun(updated);
      else await loadRun();
      toast("Reverted to Draft", "Payroll run is back in Draft.", "success");
    } catch (e) {
      toast(
        "Revert failed",
        e instanceof Error ? e.message : "Failed to revert to draft",
        "error",
      );
    } finally {
      setIsWorking(false);
    }
  };

  const handleUnapprove = async () => {
    if (!run) return;
    if (!window.confirm("Revert this run from Approved back to Processed?")) return;
    setIsWorking(true);
    try {
      const updated = await unapproveRun(run.id);
      if (updated.items) setRun(updated);
      else await loadRun();
      toast("Reverted to Processed", "Payroll run is back in Processed.", "success");
    } catch (e) {
      toast(
        "Revert failed",
        e instanceof Error ? e.message : "Failed to revert to processed",
        "error",
      );
    } finally {
      setIsWorking(false);
    }
  };

  const handlePay = async () => {
    if (!run) return;
    setIsWorking(true);
    try {
      await payRun(run.id, {
        paymentMethod,
        ...(paymentReference.trim()
          ? { paymentReference: paymentReference.trim() }
          : {}),
        paidOn,
        ...(payNotes.trim() ? { notes: payNotes.trim() } : {}),
      });
      await loadRun();
      setIsPayOpen(false);
      setPaymentReference("");
      setPayNotes("");
      toast(
        "Marked as paid",
        "A staff-salary expense was recorded for this run.",
        "success",
      );
    } catch (e) {
      toast(
        "Payment failed",
        e instanceof Error ? e.message : "Failed to mark payroll as paid",
        "error",
      );
    } finally {
      setIsWorking(false);
    }
  };

  if (isLoading && !run) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading payroll run...
        </span>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate("/payroll/runs")}
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to runs
        </Button>

        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error ?? "Payroll run not found."}
        </div>
      </div>
    );
  }

  const items = run.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/payroll/runs"
            className="mb-1 inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            All payroll runs
          </Link>

          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {periodLabel(run.periodMonth, run.periodYear)}
            </h2>
            <RunStatusBadge status={run.status} />
          </div>

          <p className="text-xs text-muted-foreground">
            {run.employeeCount} employee(s) · generated{" "}
            {formatDateTime(run.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canProcess && run.status === "PROCESSED" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleUnprocess}
              disabled={isWorking}
              className="text-xs"
            >
              Revert to Draft
            </Button>
          )}

          {canProcess && run.status === "DRAFT" && (
            <Button
              type="button"
              onClick={handleProcess}
              disabled={isWorking || items.length === 0}
              className="bg-blue-600 text-xs hover:bg-blue-700"
            >
              {isWorking ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              Process Payroll
            </Button>
          )}

          {canApprove && run.status === "APPROVED" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleUnapprove}
              disabled={isWorking}
              className="text-xs"
            >
              Revert to Processed
            </Button>
          )}

          {canApprove && run.status === "PROCESSED" && (
            <Button
              type="button"
              onClick={handleApprove}
              disabled={isWorking}
              className="bg-amber-600 text-xs hover:bg-amber-700"
            >
              {isWorking ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              )}
              Approve Payroll
            </Button>
          )}

          {canPay && run.status === "APPROVED" && (
            <Button
              type="button"
              onClick={() => setIsPayOpen(true)}
              disabled={isWorking}
              className="bg-emerald-600 text-xs hover:bg-emerald-700"
            >
              <Wallet className="mr-1.5 h-3.5 w-3.5" />
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      {/* Workflow banner */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-slate-50 px-3 py-2 text-[11px] dark:bg-slate-900/40">
        {(["DRAFT", "PROCESSED", "APPROVED", "PAID"] as const).map(
          (step, index, all) => {
            const order = all.indexOf(run.status);
            const done = index <= order;
            return (
              <React.Fragment key={step}>
                {index > 0 && (
                  <span className="text-slate-300 dark:text-slate-700">→</span>
                )}
                <span
                  className={
                    done
                      ? "font-semibold text-slate-800 dark:text-slate-200"
                      : "text-muted-foreground"
                  }
                >
                  {step}
                </span>
              </React.Fragment>
            );
          },
        )}

        <span className="ml-auto text-muted-foreground">
          {run.status === "DRAFT"
            ? "Adjustments are allowed only while this run is a draft."
            : "Figures are frozen — a payslip never changes after processing."}
        </span>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Employees</p>
            <p className="mt-1 text-lg font-bold">{run.employeeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Gross</p>
            <p className="mt-1 text-lg font-bold">
              {formatCurrency(run.totalGross)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">
              Deductions (incl. LOP)
            </p>
            <p className="mt-1 text-lg font-bold text-red-600">
              {formatCurrency(run.totalDeductions)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Net payable</p>
            <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(run.totalNet)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Paid via</p>
            <p className="mt-1 text-sm font-semibold">
              {run.paymentMethod ?? "Not paid"}
            </p>
            {run.paymentReference && (
              <p className="font-mono text-[10px] text-muted-foreground">
                {run.paymentReference}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {run.notes && (
        <div className="rounded-md border border-border bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900/40">
          <span className="font-semibold">Notes:</span> {run.notes}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold">
              Employee Payroll Lines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PayrollRunItemsTable
              items={items}
              isLoading={isLoading}
              canAdjust={canProcess && run.status === "DRAFT"}
              onAdjust={(item) => setAdjustItem(item)}
              onViewPayslip={handleViewPayslip}
            />
          </CardContent>
        </Card>

        <BonusDeductionPanel
          rows={adjustments.rows}
          totals={adjustments.totals}
          periods={adjustments.availablePeriods}
          year={adjustYear}
          month={adjustMonth}
          isLoading={isAdjustmentsLoading}
          expandedBonusId={expandedBonusId}
          expandedDeductionId={expandedDeductionId}
          onToggleBonus={(employeeId) =>
            setExpandedBonusId((current) =>
              current === employeeId ? null : employeeId,
            )
          }
          onToggleDeduction={(employeeId) =>
            setExpandedDeductionId((current) =>
              current === employeeId ? null : employeeId,
            )
          }
          onYearChange={setAdjustYear}
          onMonthChange={setAdjustMonth}
        />
      </div>

      {register && <PayrollRegisterTable register={register} isLoading={isRegisterLoading} />}

      {/* Adjust dialog */}
      <RunItemAdjustDialog
        item={adjustItem}
        open={Boolean(adjustItem)}
        isSaving={isAdjusting}
        onClose={() => setAdjustItem(null)}
        onSave={handleAdjustSave}
      />

      {/* Payslip dialog */}
      <PrintablePayslip
        open={isPayslipOpen && Boolean(payslip)}
        onOpenChange={setIsPayslipOpen}
        item={payslip?.item ?? items[0]}
        run={payslip?.run ?? run}
      />

      {/* Mark paid dialog */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogClose onClick={() => !isWorking && setIsPayOpen(false)} />

        <DialogHeader>
          <DialogTitle>Mark Payroll as Paid</DialogTitle>
          <DialogDescription>
            Records {formatCurrency(run.totalNet)} as a staff-salary expense for{" "}
            {periodLabel(run.periodMonth, run.periodYear)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-xs font-medium">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              disabled={isWorking}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {PAYMENT_METHOD_OPTIONS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium">Reference (optional)</label>
              <Input
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                placeholder="UTR / cheque number"
                maxLength={150}
                disabled={isWorking}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Paid On</label>
              <Input
                type="date"
                value={paidOn}
                onChange={(event) => setPaidOn(event.target.value)}
                disabled={isWorking}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Notes (optional)</label>
            <textarea
              value={payNotes}
              onChange={(event) => setPayNotes(event.target.value)}
              maxLength={500}
              disabled={isWorking}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPayOpen(false)}
              disabled={isWorking}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handlePay}
              disabled={isWorking}
              className="bg-emerald-600 text-xs hover:bg-emerald-700"
            >
              {isWorking && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              {isWorking ? "Recording..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}