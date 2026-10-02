import React, { useMemo, useState } from "react";
import { AlertTriangle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { SalaryStructureDialog } from "@/components/payroll/salary-structure-dialog";
import type { SalaryStructureFormValues } from "@/components/payroll/salary-structure-dialog";

import { usePayroll } from "@/lib/payroll-fm/store";
import { usePayrollAccess } from "@/lib/payroll-fm/access";
import { employeeFullName, formatDate, sumLines } from "@/lib/payroll-fm/helpers";
import { formatCurrency } from "@/lib/utils";

import type { SalaryStructure } from "@/lib/types/payroll";

export default function PayrollStructuresPage() {
  const {
    structures,
    components,
    employees,
    missingStructures,
    loading,
    addStructure,
    editStructure,
    removeStructure,
  } = usePayroll();
  const {
    canCreateStructures,
    canUpdateStructures,
    canDeleteStructures,
  } = usePayrollAccess();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SalaryStructure | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const missingEmployeeIds = useMemo(
    () => missingStructures.map((employee) => employee.id),
    [missingStructures],
  );

  const handleSubmit = async (values: SalaryStructureFormValues) => {
    setIsSaving(true);
    try {
      if (editing) {
        const { employeeId: _employeeId, ...rest } = values;
        await editStructure(editing.id, rest);
        toast("Structure updated", "Salary lines were replaced.", "success");
      } else {
        if (!values.employeeId) return;
        const { effectiveTo, notes, ...createPayload } = values;
        await addStructure({
          ...createPayload,
          employeeId: values.employeeId,
          ...(effectiveTo ? { effectiveTo } : {}),
          ...(notes ? { notes } : {}),
        });
        toast("Structure created", "Payroll will pick it up from its effective date.", "success");
      }
      setIsDialogOpen(false);
      setEditing(null);
    } catch (e) {
      toast(
        "Save failed",
        e instanceof Error ? e.message : "Failed to save salary structure",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (structure: SalaryStructure) => {
    if (
      !window.confirm(
        `Delete the salary structure for ${employeeFullName(structure.employee)}?\n\n` +
          "Employees without a structure are skipped when payroll is generated.",
      )
    ) {
      return;
    }

    setDeletingId(structure.id);
    try {
      await removeStructure(structure.id);
      toast("Structure deleted", undefined, "success");
    } catch (e) {
      toast(
        "Delete failed",
        e instanceof Error ? e.message : "Failed to delete salary structure",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Salary Structures
          </h2>
          <p className="text-xs text-muted-foreground">
            Versioned per employee · a new structure closes the previous one
          </p>
        </div>

        {canCreateStructures && (
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setIsDialogOpen(true);
            }}
            className="bg-blue-600 text-xs hover:bg-blue-700"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Structure
          </Button>
        )}
      </div>

      {missingStructures.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            <p className="font-semibold">
              {missingStructures.length} active employee(s) have no salary
              structure
            </p>
            <p className="mt-0.5">
              {missingStructures
                .slice(0, 8)
                .map((employee) => employee.employeeCode)
                .join(", ")}
              {missingStructures.length > 8
                ? ` and ${missingStructures.length - 8} more`
                : ""}
              {" "}
              will be skipped by payroll until a structure is created.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm font-bold">
            <span>Salary Structures ({structures.length})</span>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {structures.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <Plus className="mb-3 h-8 w-8 text-muted-foreground" />
              <h3 className="text-sm font-semibold">No salary structures yet</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a structure for an employee before generating payroll.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead className="text-right">Annual CTC</TableHead>
                    <TableHead className="text-right">Monthly Basic</TableHead>
                    <TableHead className="text-right">Lines</TableHead>
                    <TableHead>Effective from</TableHead>
                    <TableHead className="w-[130px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {structures.map((structure) => {
                    const items = structure.items ?? [];
                    const isOpen = expandedId === structure.id;

                    return (
                      <React.Fragment key={structure.id}>
                        <TableRow>
                          <TableCell>
                            <p className="text-sm font-medium">
                              {employeeFullName(structure.employee)}
                            </p>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {structure.employee?.employeeCode ?? "-"}
                            </p>
                          </TableCell>

                          <TableCell className="text-xs">
                            {structure.employee?.designation?.title ?? "-"}
                          </TableCell>

                          <TableCell className="text-right text-xs tabular-nums font-medium">
                            {formatCurrency(structure.ctc)}
                          </TableCell>

                          <TableCell className="text-right text-xs tabular-nums">
                            {formatCurrency(structure.basicSalary)}
                          </TableCell>

                          <TableCell>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(isOpen ? null : structure.id)
                              }
                              className="text-xs font-medium text-blue-600 hover:underline"
                            >
                              {items.length} line(s)
                            </button>
                          </TableCell>

                          <TableCell className="text-xs">
                            {formatDate(structure.effectiveFrom)}
                            {structure.effectiveTo && (
                              <span className="block text-[10px] text-muted-foreground">
                                to {formatDate(structure.effectiveTo)}
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="flex justify-end gap-1">
                              {(canUpdateStructures || canDeleteStructures) && (
                                <>
                                  {canUpdateStructures && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setEditing(structure);
                                        setIsDialogOpen(true);
                                      }}
                                      className="h-8 w-8 text-slate-500 hover:text-blue-600"
                                      title="Edit structure"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                  )}

                                  {canDeleteStructures && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(structure)}
                                      disabled={deletingId === structure.id}
                                      className="h-8 w-8 text-slate-400 hover:text-red-600"
                                      title="Delete structure"
                                    >
                                      {deletingId === structure.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {isOpen && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-slate-50 dark:bg-slate-900/40">
                              <div className="space-y-2 py-1">
                                <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  <span className="col-span-6">Component</span>
                                  <span className="col-span-3">Type</span>
                                  <span className="col-span-3 text-right">
                                    Monthly amount
                                  </span>
                                </div>

                                {items.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">
                                    Only the basic salary line applies.
                                  </p>
                                ) : (
                                  items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="grid grid-cols-12 gap-2 text-xs"
                                    >
                                      <span className="col-span-6">
                                        {item.customName}
                                        {!item.componentId && (
                                          <span className="ml-1 text-[10px] text-muted-foreground">
                                            (custom)
                                          </span>
                                        )}
                                      </span>
                                      <span className="col-span-3 text-muted-foreground">
                                        {item.type === "EARNING"
                                          ? "Earning"
                                          : "Deduction"}
                                      </span>
                                      <span className="col-span-3 text-right tabular-nums">
                                        {formatCurrency(item.amount)}
                                      </span>
                                    </div>
                                  ))
                                )}

                                <div className="flex justify-end gap-6 border-t border-border pt-2 text-[11px]">
                                  <span className="text-muted-foreground">
                                    Lines net{" "}
                                    <strong className="ml-1 text-slate-700 dark:text-slate-200">
                                      {formatCurrency(
                                        sumLines(
                                          items
                                            .filter((item) => item.type === "EARNING")
                                            .map((item) => ({
                                              componentId: item.componentId,
                                              name: item.customName,
                                              amount: item.amount,
                                            })),
                                        ) -
                                          sumLines(
                                            items
                                              .filter((item) => item.type === "DEDUCTION")
                                              .map((item) => ({
                                                componentId: item.componentId,
                                                name: item.customName,
                                                amount: item.amount,
                                              })),
                                          ),
                                      )}
                                    </strong>
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <SalaryStructureDialog
        open={isDialogOpen}
        structure={editing}
        components={components}
        employees={employees}
        missingEmployeeIds={missingEmployeeIds}
        isSaving={isSaving}
        onClose={() => {
          setIsDialogOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}