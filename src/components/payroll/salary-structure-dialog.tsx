import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

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
import { onlyDecimal } from "@/lib/input-restrictions";
import { formatCurrency } from "@/lib/utils";
import { toISODate } from "@/lib/payroll-fm/helpers";
import { COMPONENT_TYPE_OPTIONS } from "@/lib/payroll-fm/types";

import type {
  PayrollEmployee,
} from "@/lib/payroll-fm/types";
import type {
  SalaryComponent,
  SalaryComponentType,
  SalaryStructure,
  SalaryStructureItemInput,
} from "@/lib/types/payroll";

interface DraftLine {
  componentId: string;
  customName: string;
  type: SalaryComponentType;
  amount: string;
}

/** Values collected by the dialog; `employeeId` is fixed when editing. */
export interface SalaryStructureFormValues {
  employeeId?: string;
  ctc: number;
  basicSalary: number;
  effectiveFrom: string;
  /** `null` clears the existing value when editing an existing structure. */
  effectiveTo?: string | null;
  /** `null` clears the existing value when editing an existing structure. */
  notes?: string | null;
  items: SalaryStructureItemInput[];
}

interface SalaryStructureDialogProps {
  open: boolean;
  /** Null creates a new structure; present edits that one. */
  structure: SalaryStructure | null;
  components: SalaryComponent[];
  employees: PayrollEmployee[];
  /** Employees with no structure at all — offered first when creating. */
  missingEmployeeIds: string[];
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (payload: SalaryStructureFormValues) => Promise<void> | void;
}

function emptyLine(): DraftLine {
  return { componentId: "", customName: "", type: "EARNING", amount: "" };
}

export function SalaryStructureDialog({
  open,
  structure,
  components,
  employees,
  missingEmployeeIds,
  isSaving = false,
  onClose,
  onSubmit,
}: SalaryStructureDialogProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [ctc, setCtc] = useState("");
  const [basicSalary, setBasicSalary] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(toISODate(new Date()));
  const [effectiveTo, setEffectiveTo] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setError(null);
    setEffectiveTo("");
    setNotes("");

    if (structure) {
      setEmployeeId(structure.employeeId);
      setCtc(String(structure.ctc));
      setBasicSalary(String(structure.basicSalary));
      setEffectiveFrom(structure.effectiveFrom.slice(0, 10));
      // Preserve the existing window and notes, otherwise saving an unrelated
      // edit would silently drop them.
      setEffectiveTo(structure.effectiveTo?.slice(0, 10) ?? "");
      setNotes(structure.notes ?? "");
      setLines(
        structure.items?.length
          ? structure.items.map((item) => ({
              componentId: item.componentId ?? "",
              customName: item.customName,
              type: item.type,
              amount: String(item.amount),
            }))
          : [emptyLine()],
      );
      return;
    }

    setEmployeeId("");
    setCtc("");
    setBasicSalary("");
    setEffectiveFrom(toISODate(new Date()));
    setLines([emptyLine()]);
  }, [open, structure]);

  const activeComponents = useMemo(
    () => components.filter((component) => component.isActive),
    [components],
  );

  const sortedEmployees = useMemo(
    () =>
      employees
        .filter((employee) =>
          structure ? employee.id === structure.employeeId : true,
        )
        .slice()
        .sort((a, b) => {
          // Employees with no structure yet are the ones who need attention.
          const aMissing = missingEmployeeIds.includes(a.id) ? 0 : 1;
          const bMissing = missingEmployeeIds.includes(b.id) ? 0 : 1;
          if (aMissing !== bMissing) return aMissing - bMissing;
          return a.fullName.localeCompare(b.fullName);
        }),
    [employees, structure, missingEmployeeIds],
  );

  const updateLine = (index: number, patch: Partial<DraftLine>) => {
    setLines((prev) =>
      prev.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    );
  };

  const handleComponentChange = (index: number, componentId: string) => {
    const component = activeComponents.find((c) => c.id === componentId);
    updateLine(index, {
      componentId,
      customName: component ? component.name : "",
      type: component ? component.type : "EARNING",
    });
  };

  const earningsTotal = lines
    .filter((line) => line.type === "EARNING")
    .reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

  const deductionsTotal = lines
    .filter((line) => line.type === "DEDUCTION")
    .reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!structure && !employeeId) {
      setError("Select an employee.");
      return;
    }

    const ctcValue = Number(ctc);
    const basicValue = Number(basicSalary);

    if (!Number.isFinite(ctcValue) || ctcValue < 0) {
      setError("Annual CTC must be zero or more.");
      return;
    }

    if (!Number.isFinite(basicValue) || basicValue < 0) {
      setError("Basic salary must be zero or more.");
      return;
    }

    if (basicValue > ctcValue && ctcValue > 0) {
      setError("Basic salary cannot exceed the annual CTC.");
      return;
    }

    if (!effectiveFrom) {
      setError("Effective-from date is required.");
      return;
    }

    if (effectiveTo && effectiveTo < effectiveFrom) {
      setError("Effective-to date cannot be before the from date.");
      return;
    }

    const items: SalaryStructureItemInput[] = [];
    const seenNames = new Set<string>();
    const seenComponents = new Set<string>();

    for (const line of lines) {
      const name = line.customName.trim();
      if (!name && !line.amount) continue;

      if (!name) {
        setError("Every salary line needs a name.");
        return;
      }

      if (name.length > 100) {
        setError(`"${name.slice(0, 20)}…" exceeds the 100 character name limit.`);
        return;
      }

      const amount = Number(line.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        setError(`"${name}" has an invalid amount.`);
        return;
      }

      const nameKey = `${line.type}:${name.toLowerCase()}`;
      if (seenNames.has(nameKey)) {
        setError(`Duplicate salary line "${name}".`);
        return;
      }
      seenNames.add(nameKey);

      if (line.componentId) {
        if (seenComponents.has(line.componentId)) {
          setError("A component can only be used once per structure.");
          return;
        }
        seenComponents.add(line.componentId);
      }

      items.push({
        customName: name,
        type: line.type,
        amount,
        ...(line.componentId ? { componentId: line.componentId } : {}),
      });
    }

    if (items.length === 0) {
      setError("Add at least one salary line (basic salary is added automatically).");
      return;
    }

    if (items.length > 60) {
      setError("A salary structure can hold at most 60 lines.");
      return;
    }

    if (!items.some((item) => item.type === "EARNING" && item.amount > 0)) {
      setError("At least one earning line must have a non-zero amount.");
      return;
    }

    setError(null);

    await onSubmit({
      ...(structure ? {} : { employeeId }),
      ctc: ctcValue,
      basicSalary: basicValue,
      effectiveFrom,
      // On update, send `null` rather than omitting so that clearing a field
      // actually clears it instead of silently keeping the old value.
      ...(structure
        ? { effectiveTo: effectiveTo || null, notes: notes.trim() || null }
        : {
            ...(effectiveTo ? { effectiveTo } : {}),
            ...(notes.trim() ? { notes: notes.trim() } : {}),
          }),
      items,
    });
  };

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
        <DialogTitle>
          {structure ? "Edit Salary Structure" : "New Salary Structure"}
        </DialogTitle>
        <DialogDescription>
          Basic salary is always the first earning on a payslip. CTC is annual;
          earnings here are monthly amounts.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="max-h-[65vh] space-y-4 overflow-y-auto pt-4 pr-1">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {!structure && (
          <div className="space-y-2">
            <label className="text-xs font-medium">Employee</label>
            <select
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              disabled={isSaving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select an employee</option>
              {sortedEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.employeeCode} · {employee.fullName}
                  {missingEmployeeIds.includes(employee.id)
                    ? " (no structure yet)"
                    : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-medium">Annual CTC</label>
            <Input
              type="text"
              inputMode="decimal"
              value={ctc}
              onChange={(event) => setCtc(onlyDecimal(event.target.value, 12, 2))}
              placeholder="600000"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Monthly Basic Salary</label>
            <Input
              type="text"
              inputMode="decimal"
              value={basicSalary}
              onChange={(event) =>
                setBasicSalary(onlyDecimal(event.target.value, 12, 2))
              }
              placeholder="25000"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-medium">Effective From</label>
            <Input
              type="date"
              value={effectiveFrom}
              onChange={(event) => setEffectiveFrom(event.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">
              Effective To <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              type="date"
              value={effectiveTo}
              onChange={(event) => setEffectiveTo(event.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* salary lines */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">Salary Lines</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLines((prev) => [...prev, emptyLine()])}
              disabled={isSaving}
              className="h-7 text-[11px]"
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Line
            </Button>
          </div>

          <div className="space-y-2 rounded-md border border-border p-2">
            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-12 items-center gap-2">
                <select
                  value={line.componentId}
                  onChange={(event) => handleComponentChange(index, event.target.value)}
                  disabled={isSaving}
                  className="col-span-4 h-9 rounded-md border border-input bg-background px-2 text-[11px]"
                >
                  <option value="">Custom line</option>
                  {activeComponents.map((component) => (
                    <option key={component.id} value={component.id}>
                      {component.name}
                    </option>
                  ))}
                </select>

                <Input
                  value={line.customName}
                  onChange={(event) =>
                    updateLine(index, { customName: event.target.value })
                  }
                  placeholder="Line name"
                  maxLength={100}
                  disabled={isSaving}
                  className="col-span-4 h-9 text-[11px]"
                />

                <select
                  value={line.type}
                  onChange={(event) =>
                    updateLine(index, {
                      type: event.target.value as SalaryComponentType,
                    })
                  }
                  disabled={isSaving || Boolean(line.componentId)}
                  className="col-span-2 h-9 rounded-md border border-input bg-background px-2 text-[11px]"
                >
                  {COMPONENT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <Input
                  type="text"
                  inputMode="decimal"
                  value={line.amount}
                  onChange={(event) =>
                    updateLine(index, {
                      amount: onlyDecimal(event.target.value, 12, 2),
                    })
                  }
                  placeholder="0"
                  disabled={isSaving}
                  className="col-span-1 h-9 text-right text-[11px]"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setLines((prev) =>
                      prev.length === 1
                        ? [emptyLine()]
                        : prev.filter((_, lineIndex) => lineIndex !== index),
                    )
                  }
                  disabled={isSaving || lines.length === 1}
                  className="col-span-1 h-8 w-8 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            <div className="flex justify-end gap-5 border-t border-border pt-2 text-[11px]">
              <span className="text-muted-foreground">
                Earnings{" "}
                <strong className="ml-1 text-emerald-600">
                  {formatCurrency(earningsTotal)}
                </strong>
              </span>
              <span className="text-muted-foreground">
                Deductions{" "}
                <strong className="ml-1 text-red-600">
                  {formatCurrency(deductionsTotal)}
                </strong>
              </span>
              <span className="text-muted-foreground">
                Net of lines{" "}
                <strong className="ml-1 text-slate-700 dark:text-slate-200">
                  {formatCurrency(earningsTotal - deductionsTotal)}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="e.g. Revised after the April increment"
            maxLength={500}
            disabled={isSaving}
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
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
            {isSaving
              ? "Saving..."
              : structure
                ? "Save Structure"
                : "Create Structure"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}