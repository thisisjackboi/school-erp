"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { executePromotion, previewPromotion } from "@/lib/api/student-promotions.api";
import {
  PROMOTION_OUTCOME_LABELS,
  createsNewEnrollment,
  type PromotionOutcome,
  type PromotionPreview,
  type PromotionScopeOptions,
} from "@/lib/types/student-promotion";
import type { StudentRecord } from "@/lib/types/student";
import { AlertTriangle, Loader2 } from "lucide-react";

const OUTCOMES: PromotionOutcome[] = [
  "PROMOTED",
  "RETAINED",
  "TRANSFERRED_OUT",
  "WITHDRAWN",
  "GRADUATED",
];

interface PromoteStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string | null;
  scope: PromotionScopeOptions | null;
  students: StudentRecord[];
  onDone: () => void;
}

/**
 * One dialog answers "where do these students go?": action, destination session,
 * class and section, plus optional roll number and remark. Defaults are filled
 * in so the normal case is open -> confirm.
 */
export function PromoteStudentsDialog({
  open,
  onOpenChange,
  accessToken,
  scope,
  students,
  onDone,
}: PromoteStudentsDialogProps) {
  const { toast } = useToast();

  const [outcome, setOutcome] = useState<PromotionOutcome>("PROMOTED");
  const [toSessionId, setToSessionId] = useState("");
  const [toClassId, setToClassId] = useState("");
  const [toSectionId, setToSectionId] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [preview, setPreview] = useState<PromotionPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const source = students[0]?.enrollment;
  const enrolling = createsNewEnrollment(outcome);
  const isBulk = students.length > 1;

  const sessions = useMemo(
    () => [...(scope?.sessions ?? [])].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [scope],
  );
  const classes = useMemo(
    () => [...(scope?.classes ?? [])].sort((a, b) => a.displayOrder - b.displayOrder),
    [scope],
  );

  // Next session, and the class after the current one by display order.
  const nextSessionId = useMemo(() => {
    if (!source) return "";
    const index = sessions.findIndex((s) => s.id === source.academicSession.id);
    return sessions[index + 1]?.id ?? sessions.find((s) => s.id !== source.academicSession.id)?.id ?? "";
  }, [sessions, source]);

  const nextClassId = useMemo(() => {
    if (!source) return "";
    const next = classes.find((c) => c.displayOrder > source.class.displayOrder);
    return next?.id ?? source.class.id;
  }, [classes, source]);

  // A blank selection means "use the suggestion", so defaults never need an effect.
  const resolvedClassId = toClassId || (outcome === "RETAINED" ? source?.class.id : nextClassId) || "";
  const destinationSections = useMemo(
    () => (scope?.sections ?? []).filter((s) => s.academicSessionId === toSessionId && s.classId === resolvedClassId),
    [scope, toSessionId, resolvedClassId],
  );
  const resolvedSectionId =
    destinationSections.find((s) => s.id === toSectionId)?.id ??
    destinationSections.find((s) => s.name === source?.section.name)?.id ??
    destinationSections[0]?.id ??
    "";

  // Reset to a clean, pre-filled state every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setOutcome("PROMOTED");
    setToSessionId(nextSessionId);
    setToClassId("");
    setToSectionId("");
    setRollNumber("");
    setRemarks("");
    setPreview(null);
  }, [open, nextSessionId]);

  // Best-effort context: next free roll number and any blocking conflicts.
  useEffect(() => {
    if (!open || !accessToken || !source || !toSessionId || !resolvedClassId || !resolvedSectionId) {
      return;
    }
    let active = true;
    previewPromotion(accessToken, {
      fromSessionId: source.academicSession.id,
      fromClassId: source.class.id,
      fromSectionId: source.section.id,
      toSessionId,
    })
      .then((data) => {
        if (active) setPreview(data);
      })
      .catch(() => {
        if (active) setPreview(null);
      });
    return () => {
      active = false;
    };
  }, [open, accessToken, source, toSessionId, resolvedClassId, resolvedSectionId]);

  const conflicts = useMemo(() => {
    if (!preview) return [];
    const ids = new Set(students.map((s) => s.id));
    return preview.students.filter((s) => ids.has(s.studentId) && s.conflict);
  }, [preview, students]);

  const nextFreeRoll = useMemo(() => {
    const taken = new Set(preview?.to.takenRollNumbersBySection?.[resolvedSectionId] ?? []);
    let n = 1;
    while (taken.has(String(n))) n += 1;
    return String(n);
  }, [preview, resolvedSectionId]);

  const sameSession = Boolean(source) && toSessionId === source?.academicSession.id;
  const missingSections = enrolling && !resolvedSectionId;

  const handleOutcomeChange = (value: PromotionOutcome) => {
    setOutcome(value);
    setToClassId("");
    setToSectionId("");
    if (!createsNewEnrollment(value)) setRollNumber("");
  };

  const handleSubmit = async () => {
    if (!accessToken || !source || !students.length) return;
    try {
      setSubmitting(true);
      const result = await executePromotion(accessToken, {
        fromSessionId: source.academicSession.id,
        fromClassId: source.class.id,
        fromSectionId: source.section.id,
        toSessionId,
        decisions: students.map((s) => ({
          studentId: s.id,
          outcome,
          ...(enrolling ? { toClassId: resolvedClassId, toSectionId: resolvedSectionId } : {}),
          ...(rollNumber.trim() ? { rollNumber: rollNumber.trim() } : {}),
          ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
        })),
      });
      toast(
        "Promotion complete",
        `${result.promoted} student(s) moved to ${result.toSession.name}.`,
        "success",
      );
      onOpenChange(false);
      onDone();
    } catch (error) {
      toast(
        "Promotion failed",
        error instanceof Error ? error.message : "The batch could not be applied",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4">
        <DialogHeader>
          <DialogTitle>
            {isBulk
              ? `Where should these ${students.length} students be promoted?`
              : `Where should ${students[0]?.firstName ?? ""} ${students[0]?.lastName ?? ""} be promoted?`}
          </DialogTitle>
          <DialogDescription>
            {source
              ? `Currently ${source.academicSession.name} · ${source.class.name} · Section ${source.section.name} · Roll ${source.rollNumber ?? "—"}`
              : "Select a class and section first."}
          </DialogDescription>
        </DialogHeader>

        {conflicts.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              {conflicts.length} selected student(s) already have an enrollment in{" "}
              {sessions.find((s) => s.id === toSessionId)?.name}. They will be rejected.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Action
            </span>
            <select
              value={outcome}
              onChange={(e) => handleOutcomeChange(e.target.value as PromotionOutcome)}
              className="h-9 rounded-md border border-input bg-background px-2 text-xs"
            >
              {OUTCOMES.map((o) => (
                <option key={o} value={o}>
                  {PROMOTION_OUTCOME_LABELS[o]}
                </option>
              ))}
            </select>
          </label>

          {enrolling && (
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Move to session
                </span>
                <select
                  value={toSessionId}
                  onChange={(e) => {
                    setToSessionId(e.target.value);
                    setToClassId("");
                    setToSectionId("");
                  }}
                  className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="">Select session</option>
                  {sessions
                    .filter((s) => s.id !== source?.academicSession.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Class
                </span>
                <select
                  value={resolvedClassId}
                  onChange={(e) => {
                    setToClassId(e.target.value);
                    setToSectionId("");
                  }}
                  className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Section
                </span>
                <select
                  value={resolvedSectionId}
                  onChange={(e) => setToSectionId(e.target.value)}
                  disabled={!resolvedClassId || destinationSections.length === 0}
                  className="h-9 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-50"
                >
                  <option value="">Select section</option>
                  {destinationSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {enrolling && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  New roll number
                </span>
                <input
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder={`Auto · next free is ${nextFreeRoll}`}
                  maxLength={10}
                  className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Remarks
                </span>
                <input
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional note"
                  maxLength={500}
                  className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                />
              </label>
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Bus seats, hostel beds and all past attendance, marks, report cards and fee records are
          carried over. The whole batch is applied in one go.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !students.length || sameSession || missingSections || conflicts.length > 0}
            className="bg-emerald-600 text-xs hover:bg-emerald-700"
          >
            {submitting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : null}
            {isBulk ? `Promote ${students.length} students` : "Promote student"}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
