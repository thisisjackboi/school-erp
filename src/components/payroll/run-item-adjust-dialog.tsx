import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

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
import { formatCurrency } from "@/lib/utils";
import {
  bonusAmountOf,
  employeeFullName,
  otherDeductionNameOf,
  otherDeductionOf,
} from "@/lib/payroll-fm/helpers";

import type {
  PayrollRunItem,
  UpdatePayrollRunItemPayload,
} from "@/lib/types/payroll";

interface RunItemAdjustDialogProps {
  item: PayrollRunItem | null;
  open: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (payload: UpdatePayrollRunItemPayload) => Promise<void> | void;
}

/**
 * Adjustments are recalculated on the server so that the printed lines always
 * add up to the totals. This dialog only collects intent.
 */
export function RunItemAdjustDialog({
  item,
  open,
  isSaving = false,
  onClose,
  onSave,
}: RunItemAdjustDialogProps) {
  const [workingDays, setWorkingDays] = useState(0);
  const [paidDays, setPaidDays] = useState(0);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [otherDeductionAmount, setOtherDeductionAmount] = useState(0);
  const [otherDeductionName, setOtherDeductionName] = useState("Other Deduction");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setWorkingDays(item.workingDays);
    setPaidDays(item.paidDays);
    setBonusAmount(bonusAmountOf(item.earnings));
    setOtherDeductionAmount(otherDeductionOf(item.deductions));
    setOtherDeductionName(otherDeductionNameOf(item.deductions));
    setError(null);
  }, [item]);

  if (!item) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (workingDays < 1 || workingDays > 31) {
      setError("Working days must be between 1 and 31.");
      return;
    }

    if (paidDays < 0 || paidDays > workingDays) {
      setError(
        `Paid days (${paidDays}) cannot exceed working days (${workingDays}).`,
      );
      return;
    }

    if (bonusAmount < 0 || otherDeductionAmount < 0) {
      setError("Bonus and deduction amounts cannot be negative.");
      return;
    }

    setError(null);

    await onSave({
      workingDays,
      paidDays,
      bonusAmount,
      otherDeductionAmount,
      otherDeductionName: otherDeductionName.trim() || "Other Deduction",
    });
  };

  const lopDays = Math.max(0, workingDays - paidDays);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isSaving) return;
        if (!next) onClose();
      }}
    >
      <DialogClose onClick={() => !isSaving && onClose()} />

      <DialogHeader>
        <DialogTitle>Adjust Payroll Line</DialogTitle>
        <DialogDescription>
          {employeeFullName(item.employee)} · {item.employee?.employeeCode ?? ""}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-medium">Working Days</label>
            <Input
              type="number"
              min={1}
              max={31}
              value={workingDays}
              onChange={(event) => setWorkingDays(Number(event.target.value))}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Paid Days</label>
            <Input
              type="number"
              min={0}
              max={31}
              value={paidDays}
              onChange={(event) => setPaidDays(Number(event.target.value))}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Loss of Pay</label>
            <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm tabular-nums">
              {lopDays} day(s)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-medium">
              One-off Bonus (this month)
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={bonusAmount}
              onChange={(event) => setBonusAmount(Number(event.target.value))}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">
              One-off Deduction (this month)
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={otherDeductionAmount}
              onChange={(event) =>
                setOtherDeductionAmount(Number(event.target.value))
              }
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Deduction Label</label>
          <Input
            value={otherDeductionName}
            onChange={(event) => setOtherDeductionName(event.target.value)}
            maxLength={100}
            disabled={isSaving}
          />
        </div>

        <div className="rounded-md border border-border bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900/40">
          <p className="text-muted-foreground">
            Current net{" "}
            <strong className="ml-1 text-emerald-600 dark:text-emerald-400">
              {formatCurrency(item.netAmount)}
            </strong>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Gross, loss of pay, deductions and net are recalculated on save.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            className="bg-blue-600 text-xs hover:bg-blue-700"
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {isSaving ? "Saving..." : "Save Adjustment"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}