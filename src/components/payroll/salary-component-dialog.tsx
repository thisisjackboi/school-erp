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
import { onlyCode, onlyName } from "@/lib/input-restrictions";
import { COMPONENT_TYPE_OPTIONS } from "@/lib/payroll-fm/types";

import type {
  SalaryComponent,
  SalaryComponentType,
} from "@/lib/types/payroll";

interface SalaryComponentDialogProps {
  open: boolean;
  /** Null creates a new component; present edits that one. */
  component: SalaryComponent | null;
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    code: string;
    name: string;
    type: SalaryComponentType;
    description?: string;
    isActive?: boolean;
  }) => Promise<void> | void;
}

export function SalaryComponentDialog({
  open,
  component,
  isSaving = false,
  onClose,
  onSubmit,
}: SalaryComponentDialogProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<SalaryComponentType>("EARNING");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCode(component?.code ?? "");
    setName(component?.name ?? "");
    setType(component?.type ?? "EARNING");
    setDescription(component?.description ?? "");
    setIsActive(component?.isActive ?? true);
    setError(null);
  }, [open, component]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode) {
      setError("Component code is required.");
      return;
    }

    if (trimmedCode.length > 50) {
      setError("Component code cannot exceed 50 characters.");
      return;
    }

    if (!trimmedName) {
      setError("Component name is required.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Component name cannot exceed 100 characters.");
      return;
    }

    setError(null);

    await onSubmit({
      code: trimmedCode,
      name: trimmedName,
      type,
      ...(description.trim() ? { description: description.trim() } : {}),
      // The create endpoint does not accept `isActive`; updates do.
      ...(component ? { isActive } : {}),
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
          {component ? "Edit Salary Component" : "New Salary Component"}
        </DialogTitle>
        <DialogDescription>
          Components are the earning and deduction heads available when building
          a salary structure.
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
            <label className="text-xs font-medium">Code</label>
            <Input
              value={code}
              onChange={(event) =>
                setCode(onlyCode(event.target.value, 50).toUpperCase())
              }
              placeholder="HRA"
              maxLength={50}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Type</label>
            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value as SalaryComponentType)
              }
              disabled={isSaving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {COMPONENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Name</label>
          <Input
            value={name}
            onChange={(event) => setName(onlyName(event.target.value, 100))}
            placeholder="House Rent Allowance"
            maxLength={100}
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Description (optional)</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What this head covers and when it applies"
            maxLength={500}
            disabled={isSaving}
            className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        {component && (
          <label className="flex items-center gap-2 text-xs font-medium">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              disabled={isSaving}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Active
          </label>
        )}

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
            {isSaving ? "Saving..." : component ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}