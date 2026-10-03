import React, { useMemo } from "react";
import { ChevronDown, ChevronRight, Loader2, TrendingDown, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RunStatusBadge } from "@/components/payroll/run-status-badge";
import { formatCurrency } from "@/lib/utils";

import type {
  PayrollAdjustmentEmployeeRow,
  PayrollAdjustmentPeriod,
  PayrollAdjustmentPeriodOption,
} from "@/lib/types/payroll";

type AdjustmentKind = "BONUS" | "DEDUCTION";

interface BonusDeductionPanelProps {
  rows: PayrollAdjustmentEmployeeRow[];
  totals: { totalBonus: number; totalDeduction: number; netEffect: number };
  periods: PayrollAdjustmentPeriodOption[];
  year: number | null;
  month: number | null;
  isLoading?: boolean;
  expandedBonusId: string | null;
  expandedDeductionId: string | null;
  onToggleBonus: (employeeId: string) => void;
  onToggleDeduction: (employeeId: string) => void;
  onYearChange: (year: number | null) => void;
  onMonthChange: (month: number | null) => void;
}

const ALL_PERIODS = "all";

function money(amount: number): string {
  return formatCurrency(amount);
}

const KIND_META: Record<
  AdjustmentKind,
  {
    title: string;
    empty: string;
    icon: typeof TrendingUp;
    /** Applied to the amount column, the row icon and the per-period lines. */
    amountClass: string;
    iconClass: string;
    headerClass: string;
  }
> = {
  BONUS: {
    title: "Bonus",
    empty: "No bonus has been recorded for this filter.",
    icon: TrendingUp,
    amountClass: "text-emerald-600 dark:text-emerald-400",
    iconClass: "text-emerald-600",
    headerClass: "bg-emerald-50/60 dark:bg-emerald-950/20",
  },
  DEDUCTION: {
    title: "Deduction",
    empty: "No deduction has been recorded for this filter.",
    icon: TrendingDown,
    amountClass: "text-red-600",
    iconClass: "text-red-600",
    headerClass: "bg-red-50/60 dark:bg-red-950/20",
  },
};

/** The single-type figures a row carries, so each sub-panel reads one shape. */
function amountsOf(row: PayrollAdjustmentEmployeeRow, kind: AdjustmentKind) {
  return kind === "BONUS"
    ? { total: row.totalBonus }
    : { total: row.totalDeduction };
}

/**
 * One employee row expanded into the months it was adjusted in. Months with no
 * line of this kind are dropped, so a June deduction never shows up as an empty
 * card under an employee's March bonus.
 */
function PeriodDetail({
  period,
  kind,
  meta,
}: {
  period: PayrollAdjustmentPeriod;
  kind: AdjustmentKind;
  meta: (typeof KIND_META)[AdjustmentKind];
}) {
  const lines = kind === "BONUS" ? period.bonus : period.deductions;
  const total = kind === "BONUS" ? period.totalBonus : period.totalDeduction;
  const Icon = meta.icon;

  return (
    <div className="rounded-md border border-border bg-card px-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold">{period.label}</span>
        <RunStatusBadge status={period.runStatus} />
      </div>

      {lines.map((line, index) => (
        <div
          key={`${kind}-${index}`}
          className="mt-1 flex items-center justify-between gap-2 text-[11px]"
        >
          <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
            <Icon className={`h-3 w-3 shrink-0 ${meta.iconClass}`} />
            <span className="truncate">{line.name}</span>
          </span>
          <span className={`shrink-0 font-medium tabular-nums ${meta.amountClass}`}>
            {money(line.amount)}
          </span>
        </div>
      ))}

      <div className="mt-2 flex items-center justify-between border-t border-border pt-1.5 text-[11px]">
        <span className="text-muted-foreground">Month total</span>
        <span className={`font-semibold tabular-nums ${meta.amountClass}`}>
          {money(total)}
        </span>
      </div>
    </div>
  );
}

/**
 * One of the two sub-asides: every employee who received this kind of
 * adjustment, highest first, expandable to the months it was given in.
 */
function AdjustmentSubPanel({
  kind,
  rows,
  isLoading,
  expandedId,
  onToggle,
}: {
  kind: AdjustmentKind;
  rows: PayrollAdjustmentEmployeeRow[];
  isLoading: boolean;
  expandedId: string | null;
  onToggle: (employeeId: string) => void;
}) {
  const meta = KIND_META[kind];

  // Each sub-panel lists only the employees this kind actually touched, sorted
  // by that kind alone, so the two lists are directly comparable.
  const kindRows = useMemo(() => {
    return rows
      .filter((row) => amountsOf(row, kind).total > 0)
      .sort(
        (a, b) =>
          amountsOf(b, kind).total - amountsOf(a, kind).total ||
          a.employeeCode.localeCompare(b.employeeCode),
      );
  }, [rows, kind]);

  const grandTotal = useMemo(
    () => kindRows.reduce((sum, row) => sum + amountsOf(row, kind).total, 0),
    [kindRows, kind],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border py-6">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div
        className={`flex items-center gap-1.5 border-b border-border px-3 py-2 ${meta.headerClass}`}
      >
        <meta.icon className={`h-3.5 w-3.5 ${meta.iconClass}`} />
        <span className="text-xs font-bold">{meta.title}</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {kindRows.length} employee{kindRows.length === 1 ? "" : "s"}
        </span>
      </div>

      {kindRows.length === 0 ? (
        <div className="border-b border-border px-3 py-4 text-center">
          <p className="text-[11px] text-muted-foreground">{meta.empty}</p>
        </div>
      ) : (
        <div className="max-h-[18rem] overflow-y-auto">
          {kindRows.map((row) => {
            const isOpen = expandedId === row.employeeId;
            const visiblePeriods = row.periods.filter((period) =>
              kind === "BONUS"
                ? period.bonus.length > 0
                : period.deductions.length > 0,
            );

            return (
              <div
                key={row.employeeId}
                className="border-b border-border last:border-0"
              >
                <button
                  type="button"
                  onClick={() => onToggle(row.employeeId)}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40"
                >
                  <span className="flex min-w-0 items-center gap-1">
                    {isOpen ? (
                      <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">
                        {row.name}
                      </span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {row.employeeCode} · {row.designation}
                      </span>
                    </span>
                  </span>

                  <span
                    className={`text-xs font-semibold tabular-nums ${meta.amountClass}`}
                  >
                    {money(amountsOf(row, kind).total)}
                  </span>
                </button>

                {isOpen && visiblePeriods.length > 0 && (
                  <div className="space-y-2 border-t border-border bg-slate-50/60 px-3 py-2 dark:bg-slate-900/20">
                    {visiblePeriods.map((period) => (
                      <PeriodDetail
                        key={period.runId}
                        period={period}
                        kind={kind}
                        meta={meta}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {kindRows.length > 0 && (
        <div
          className={`flex items-center justify-between border-t border-border px-3 py-2 ${meta.headerClass}`}
        >
          <span className="text-xs font-bold">Total</span>
          <span className={`text-xs font-bold tabular-nums ${meta.amountClass}`}>
            {money(grandTotal)}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Sits beside the payroll lines as two independent sub-asides: one for bonus,
 * one for deduction. Each lists only the employees that kind actually touched,
 * so a bonus is never buried under a deduction on the same row. The month and
 * year filters are shared, because the two are always read together.
 */
export function BonusDeductionPanel({
  rows,
  totals,
  periods,
  year,
  month,
  isLoading = false,
  expandedBonusId,
  expandedDeductionId,
  onToggleBonus,
  onToggleDeduction,
  onYearChange,
  onMonthChange,
}: BonusDeductionPanelProps) {
  // Derive the year dropdown from the periods that actually exist, so the list
  // never offers a year with nothing in it.
  const years = useMemo(() => {
    const unique = new Set(periods.map((p) => p.year));
    return Array.from(unique).sort((a, b) => b - a);
  }, [periods]);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold">Bonus &amp; Deduction</CardTitle>
        <p className="text-xs text-muted-foreground">
          One-off additions and deductions across payroll runs.
        </p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        {/* Shared filters: both sub-asides always cover the same periods. */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={year ?? ALL_PERIODS}
            onChange={(event) =>
              onYearChange(
                event.target.value === ALL_PERIODS
                  ? null
                  : Number(event.target.value),
              )
            }
            disabled={isLoading}
            aria-label="Filter by year"
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value={ALL_PERIODS}>All years</option>
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={month ?? ALL_PERIODS}
            onChange={(event) =>
              onMonthChange(
                event.target.value === ALL_PERIODS
                  ? null
                  : Number(event.target.value),
              )
            }
            disabled={isLoading}
            aria-label="Filter by month"
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value={ALL_PERIODS}>All months</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((option) => (
              <option key={option} value={option}>
                {new Date(Date.UTC(2026, option - 1, 1)).toLocaleDateString(
                  "en-IN",
                  { month: "long", timeZone: "UTC" },
                )}
              </option>
            ))}
          </select>
        </div>

        <AdjustmentSubPanel
          kind="BONUS"
          rows={rows}
          isLoading={isLoading}
          expandedId={expandedBonusId}
          onToggle={onToggleBonus}
        />

        <AdjustmentSubPanel
          kind="DEDUCTION"
          rows={rows}
          isLoading={isLoading}
          expandedId={expandedDeductionId}
          onToggle={onToggleDeduction}
        />

        {!isLoading && rows.length > 0 && (
          <div className="flex items-center justify-between rounded-md border border-border bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900/40">
            <span className="text-muted-foreground">Net effect on payroll</span>
            <span
              className={
                totals.netEffect < 0
                  ? "font-bold tabular-nums text-red-600"
                  : "font-bold tabular-nums text-emerald-600 dark:text-emerald-400"
              }
            >
              {money(totals.netEffect)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
