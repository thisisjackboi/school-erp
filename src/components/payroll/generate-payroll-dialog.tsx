import React, { useMemo, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

import { usePayroll } from "@/lib/payroll-fm/store";
import { daysInMonth, periodLabel, yearOptions } from "@/lib/payroll-fm/helpers";
import { MONTH_OPTIONS } from "@/lib/payroll-fm/types";

import type { GeneratePayrollResult } from "@/lib/types/payroll";

interface GeneratePayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated?: (result: GeneratePayrollResult) => void;
}

export function GeneratePayrollDialog({
  open,
  onOpenChange,
  onGenerated,
}: GeneratePayrollDialogProps) {
  const { generateRun, employees, missingStructures } = usePayroll();
  const { toast } = useToast();

  const now = useMemo(() => new Date(), []);
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(now.getFullYear());
  const [useCustomWorkingDays, setUseCustomWorkingDays] = useState(false);
  const [workingDays, setWorkingDays] = useState(
    daysInMonth(now.getFullYear(), now.getMonth() + 1),
  );
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setNotes("");
    setIsSaving(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const result = await generateRun({
        periodMonth,
        periodYear,
        ...(useCustomWorkingDays && workingDays > 0 ? { workingDays } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });

      toast(
        "Payroll generated",
        `${result.run.employeeCount} employee line(s) created as a draft for ${periodLabel(
          periodMonth,
          periodYear,
        )}.`,
        "success",
      );

      if (result.skipped.length) {
        toast(
          `${result.skipped.length} employee(s) skipped`,
          "They have no salary structure effective for this period.",
          "info",
        );
      }

      onGenerated?.(result);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate payroll");
    } finally {
      setIsSaving(false);
    }
  };

  const defaultWorkingDays = daysInMonth(periodYear, periodMonth);

  const eligibleEmployees = useMemo(
    () =>
      employees.filter(
        (employee) => employee.status === "ACTIVE" || employee.status === "ON_LEAVE",
      ),
    [employees],
  );

  const missingCount = useMemo(() => {
    const eligibleIds = new Set(eligibleEmployees.map((employee) => employee.id));
    return missingStructures.filter((employee) => eligibleIds.has(employee.id))
      .length;
  }, [missingStructures, eligibleEmployees]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isSaving) return;
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogClose onClick={() => !isSaving && onOpenChange(false)} />

      <DialogHeader>
        <DialogTitle>Generate Monthly Payroll</DialogTitle>
        <DialogDescription>
          Creates a draft run for every active employee who has a salary
          structure effective in this period. Nothing is finalised until the run
          is processed, approved and paid.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-medium">Payroll Month</label>
            <select
              value={periodMonth}
              onChange={(event) => {
                const month = Number(event.target.value);
                setPeriodMonth(month);
                setWorkingDays(daysInMonth(periodYear, month));
              }}
              disabled={isSaving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {MONTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Payroll Year</label>
            <select
              value={periodYear}
              onChange={(event) => {
                const year = Number(event.target.value);
                setPeriodYear(year);
                setWorkingDays(daysInMonth(year, periodMonth));
              }}
              disabled={isSaving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {yearOptions().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium">
            <input
              type="checkbox"
              checked={useCustomWorkingDays}
              onChange={(event) =>
                setUseCustomWorkingDays(event.target.checked)
              }
              disabled={isSaving}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Override working days for this period
          </label>

          {useCustomWorkingDays && (
            <Input
              type="number"
              min={1}
              max={31}
              value={workingDays}
              onChange={(event) => setWorkingDays(Number(event.target.value))}
              disabled={isSaving}
            />
          )}

          <p className="text-[11px] text-muted-foreground">
            {periodLabel(periodMonth, periodYear)} has {defaultWorkingDays}{" "}
            calendar days. Leave the override off unless this month has
            holidays you need to exclude.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="e.g. Includes Diwali bonus for all teaching staff"
            maxLength={500}
            disabled={isSaving}
            className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {missingCount > 0 ? (
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : null}
          <span>
            {missingCount} active employee(s) currently have no salary structure
            and will be left out of this run.
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground">
          {eligibleEmployees.length} active employee record(s) will be evaluated.
        </p>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            className="bg-emerald-600 text-xs hover:bg-emerald-700"
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {isSaving ? "Generating..." : "Generate Draft Run"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}