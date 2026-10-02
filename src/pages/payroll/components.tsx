import React, { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Power, Trash2 } from "lucide-react";

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

import { SalaryComponentDialog } from "@/components/payroll/salary-component-dialog";

import { usePayroll } from "@/lib/payroll-fm/store";
import { usePayrollAccess } from "@/lib/payroll-fm/access";

import type {
  SalaryComponent,
  SalaryComponentType,
} from "@/lib/types/payroll";

export default function PayrollComponentsPage() {
  const { components, structures, loading, addComponent, editComponent, removeComponent } =
    usePayroll();
  const {
    canCreateComponents,
    canUpdateComponents,
    canDeleteComponents,
  } = usePayrollAccess();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SalaryComponent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const usageByComponent = useMemo(() => {
    const usage = new Map<string, number>();
    for (const structure of structures) {
      for (const item of structure.items ?? []) {
        if (item.componentId) {
          usage.set(item.componentId, (usage.get(item.componentId) ?? 0) + 1);
        }
      }
    }
    return usage;
  }, [structures]);

  const filtered = useMemo(
    () =>
      components
        .filter((component) =>
          typeFilter === "ALL" ? true : component.type === typeFilter,
        )
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [components, typeFilter],
  );

  const handleSubmit = async (payload: {
    code: string;
    name: string;
    type: SalaryComponentType;
    description?: string;
    isActive?: boolean;
  }) => {
    setIsSaving(true);
    try {
      if (editing) {
        await editComponent(editing.id, payload);
        toast("Component updated", undefined, "success");
      } else {
        await addComponent(payload);
        toast("Component created", "It is now available in salary structures.", "success");
      }
      setIsDialogOpen(false);
      setEditing(null);
    } catch (e) {
      toast(
        "Save failed",
        e instanceof Error ? e.message : "Failed to save salary component",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (component: SalaryComponent) => {
    setBusyId(component.id);
    try {
      await editComponent(component.id, { isActive: !component.isActive });
      toast(
        component.isActive ? "Component deactivated" : "Component activated",
        undefined,
        "success",
      );
    } catch (e) {
      toast(
        "Update failed",
        e instanceof Error ? e.message : "Failed to update salary component",
        "error",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (component: SalaryComponent) => {
    if (
      !window.confirm(
        `Delete the "${component.name}" salary component?\n\n` +
          "It cannot be deleted while it is referenced by a salary structure. " +
          "Deactivate it instead.",
      )
    ) {
      return;
    }

    setBusyId(component.id);
    try {
      await removeComponent(component.id);
      toast("Component deleted", undefined, "success");
    } catch (e) {
      toast(
        "Delete failed",
        e instanceof Error
          ? e.message
          : "Failed to delete salary component. Deactivate it instead if it is in use.",
        "error",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Salary Components
          </h2>
          <p className="text-xs text-muted-foreground">
            Earning and deduction heads used when building salary structures
          </p>
        </div>

        {canCreateComponents && (
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setIsDialogOpen(true);
            }}
            className="bg-blue-600 text-xs hover:bg-blue-700"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Component
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {["ALL", "EARNING", "DEDUCTION"].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTypeFilter(option)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              typeFilter === option
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {option === "ALL"
              ? "All"
              : option === "EARNING"
                ? "Earnings"
                : "Deductions"}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm font-bold">
            <span>Components ({filtered.length})</span>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <Plus className="mb-3 h-8 w-8 text-muted-foreground" />
              <h3 className="text-sm font-semibold">No components found</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Add basic pay, allowances and deduction heads to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Used in</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[130px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.map((component) => (
                    <TableRow key={component.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        {component.code}
                      </TableCell>

                      <TableCell className="text-sm">
                        {component.name}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                            component.type === "EARNING"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          }`}
                        >
                          {component.type === "EARNING" ? "Earning" : "Deduction"}
                        </span>
                      </TableCell>

                      <TableCell className="max-w-[280px] text-xs text-muted-foreground">
                        {component.description ?? "-"}
                      </TableCell>

                      <TableCell className="text-right text-xs tabular-nums">
                        {usageByComponent.get(component.id) ?? 0}
                      </TableCell>

                      <TableCell className="text-xs">
                        {component.isActive ? (
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            Active
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Inactive</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {canUpdateComponents && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleActive(component)}
                                disabled={busyId === component.id}
                                className="h-8 w-8 text-slate-500 hover:text-blue-600"
                                title={component.isActive ? "Deactivate" : "Activate"}
                              >
                                <Power className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditing(component);
                                  setIsDialogOpen(true);
                                }}
                                disabled={busyId === component.id}
                                className="h-8 w-8 text-slate-500 hover:text-blue-600"
                                title="Edit component"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}

                          {canDeleteComponents && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(component)}
                              disabled={busyId === component.id}
                              className="h-8 w-8 text-slate-400 hover:text-red-600"
                              title="Delete component"
                            >
                              {busyId === component.id ? (
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

      <SalaryComponentDialog
        open={isDialogOpen}
        component={editing}
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