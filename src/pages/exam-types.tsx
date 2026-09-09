"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Loader2, Tags } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";

import {
  getExamTypes, createExamType, updateExamType, deleteExamType,
  type CreateExamTypePayload,
} from "@/lib/api/exam-types.api";

import type { ExamType } from "@/lib/types/exam";

import {
  LIMITS,
  onlyDecimal,
  trimMax,
  validateMaxLength,
  validateNumeric,
} from "@/lib/input-restrictions";

export default function ExamTypesPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExamType | null>(null);
  const [form, setForm] = useState({ name: "", weightagePercent: "" });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ExamType | null>(null);

  const loadExamTypes = async () => {
    setLoading(true);
    try {
      const data = await getExamTypes(accessToken);
      setExamTypes(data || []);
    } catch (err: any) {
      toast("Error", err.message || "Failed to load exam types", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExamTypes(); }, [accessToken]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", weightagePercent: "" });
    setModalOpen(true);
  };

  const openEdit = (type: ExamType) => {
    setEditing(type);
    setForm({
      name: type.name,
      weightagePercent: type.weightagePercent ? String(type.weightagePercent) : "",
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast("Error", "Exam type name is required", "error");
    const nameError = validateMaxLength(form.name, "Exam type name", LIMITS.EXAM_NAME_MAX);
    if (nameError) return toast("Error", nameError, "error");
    if (form.weightagePercent) {
      const weightageError = validateNumeric(form.weightagePercent, "Weightage (%)", { min: 0, max: 100 });
      if (weightageError) return toast("Error", weightageError, "error");
    }

    setSubmitting(true);
    try {
      const payload: CreateExamTypePayload = {
        name: form.name.trim(),
        weightagePercent: form.weightagePercent ? Number(form.weightagePercent) : undefined,
      };
      if (editing) {
        await updateExamType(editing.id, payload, accessToken);
        toast("Updated", `Exam type "${form.name}" updated.`, "success");
      } else {
        await createExamType(payload, accessToken);
        toast("Created", `Exam type "${form.name}" created.`, "success");
      }
      setModalOpen(false);
      setExamTypes(await getExamTypes(accessToken));
    } catch (err: any) {
      toast("Error", err.message || "Failed to save exam type", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const promptDelete = (type: ExamType) => {
    setItemToDelete(type);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setSubmitting(true);
    try {
      await deleteExamType(itemToDelete.id, accessToken);
      toast("Deleted", `Exam type "${itemToDelete.name}" deleted.`, "success");
      setExamTypes(await getExamTypes(accessToken));
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast("Error", err.message || "Failed to delete exam type", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Exam Types</h1>
            <p className="text-xs text-muted-foreground mt-1">Define categories of examinations</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-muted-foreground">Loading exam types...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Exam Types</h1>
          <p className="text-xs text-muted-foreground mt-1">Define categories of examinations (e.g. Unit Test, Mid-Term, Final)</p>
        </div>
        <Button size="sm" onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Add Exam Type
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {examTypes.length === 0 ? (
            <div className="py-16 text-center">
              <Tags className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No exam types found.</p>
              <p className="text-xs text-muted-foreground mt-1">Create an exam type to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Weightage (%)</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-semibold">{type.name}</TableCell>
                    <TableCell>
                      {type.weightagePercent != null ? (
                        <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                          {type.weightagePercent}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {type.createdAt
                        ? new Date(type.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(type)} className="h-8 w-8 p-0">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => promptDelete(type)} className="h-8 w-8 p-0 text-rose-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Exam Type" : "Create Exam Type"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold block mb-1">Type Name *</label>
            <Input
              placeholder="e.g. Unit Test"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: trimMax(e.target.value, LIMITS.EXAM_NAME_MAX) })}
              maxLength={LIMITS.EXAM_NAME_MAX}
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Weightage (%)</label>
            <Input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              placeholder="e.g. 20"
              maxLength={6}
              value={form.weightagePercent}
              onChange={(e) => setForm({ ...form, weightagePercent: onlyDecimal(e.target.value, 3, 2) })}
            />
          </div>
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="text-xs">Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-xs">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2 text-xs text-muted-foreground">
          <p>Are you sure you want to delete <strong className="text-foreground">{itemToDelete?.name}</strong>?</p>
          <p>This action cannot be undone.</p>
        </div>
        <div className="flex items-center justify-end space-x-2 pt-2">
          <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="text-xs">Cancel</Button>
          <Button onClick={confirmDelete} disabled={submitting} className="bg-red-600 hover:bg-red-700 text-xs">
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
