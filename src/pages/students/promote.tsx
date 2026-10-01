"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/enterprise/status-chip";
import { EnterpriseTable, type ColumnDef } from "@/components/enterprise/enterprise-table";
import { PromoteStudentsDialog } from "@/components/modules/student-promote-dialog";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import { useRole } from "@/lib/permissions";
import { getStudents } from "@/lib/api/students.api";
import {
  getPromotionHistory,
  getPromotionScopeOptions,
} from "@/lib/api/student-promotions.api";
import {
  PROMOTION_OUTCOME_LABELS,
  type PromotionHistoryRow,
  type PromotionScopeOptions,
} from "@/lib/types/student-promotion";
import type { StudentRecord } from "@/lib/types/student";
import { AlertTriangle, GraduationCap, Loader2, Users } from "lucide-react";

const OUTCOME_BADGE: Record<
  string,
  "success" | "info" | "warning" | "destructive" | "secondary"
> = {
  PROMOTED: "success",
  RETAINED: "info",
  TRANSFERRED_OUT: "warning",
  WITHDRAWN: "destructive",
  GRADUATED: "secondary",
};

type HistoryRow = PromotionHistoryRow & { id: string };

export default function StudentPromotionsPage() {
  const { accessToken } = useAuth();
  const { hasPermission } = useRole();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const canPromote = hasPermission("students.promote");

  const [scope, setScope] = useState<PromotionScopeOptions | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [sessionId, setSessionId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [targets, setTargets] = useState<StudentRecord[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  // One scope call powers the filters and the promotion dialog.
  useEffect(() => {
    if (!accessToken || !canPromote) return;
    getPromotionScopeOptions(accessToken)
      .then((data) => {
        setScope(data);
        const current = data.sessions.find((s) => s.isCurrent) ?? data.sessions.at(-1);
        if (current) setSessionId(current.id);
      })
      .catch((error) =>
        toast(
          "Failed to load promotion options",
          error instanceof Error ? error.message : "Could not load sessions, classes and sections",
          "error",
        ),
      );
  }, [accessToken, canPromote, toast]);

  // Deep link from the student profile: preselect that section.
  useEffect(() => {
    const wanted = searchParams.get("sectionId");
    if (!wanted || !scope) return;
    const section = scope.sections.find((s) => s.id === wanted);
    if (section) {
      setSessionId(section.academicSessionId);
      setClassId(section.classId);
      setSectionId(section.id);
    }
  }, [scope, searchParams]);

  const loadStudents = useCallback(async () => {
    if (!accessToken || !sessionId) return;
    try {
      setLoading(true);
      const data = await getStudents(accessToken, {
        academicSessionId: sessionId,
        ...(classId ? { classId } : {}),
        ...(sectionId ? { sectionId } : {}),
      });
      setStudents(data);
      setSelected(new Set());
    } catch (error) {
      toast(
        "Failed to load students",
        error instanceof Error ? error.message : "Unable to fetch the student list",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, sessionId, classId, sectionId, toast]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const loadHistory = useCallback(async () => {
    if (!accessToken) return;
    try {
      setHistory(await getPromotionHistory(accessToken));
    } catch {
      // History is secondary; a failure must not block the promotion list.
    }
  }, [accessToken]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const classes = useMemo(
    () =>
      [...(scope?.classes ?? [])]
        .filter((c) => (scope?.sections ?? []).some((s) => s.academicSessionId === sessionId && s.classId === c.id))
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [scope, sessionId],
  );

  const sections = useMemo(
    () => (scope?.sections ?? []).filter((s) => s.academicSessionId === sessionId && s.classId === classId),
    [scope, sessionId, classId],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) =>
      `${s.firstName} ${s.lastName} ${s.admissionNumber}`.toLowerCase().includes(term),
    );
  }, [students, search]);

  const active = useMemo(() => students.filter((s) => s.enrollment?.status === "ACTIVE"), [students]);
  const activeIds = useMemo(() => new Set(active.map((s) => s.id)), [active]);
  const selectableVisible = useMemo(
    () => visible.filter((s) => activeIds.has(s.id)),
    [visible, activeIds],
  );
  const selectedActive = useMemo(
    () => active.filter((s) => selected.has(s.id)),
    [active, selected],
  );

  // A batch is atomic and scoped to one class and section.
  const selectionScopes = useMemo(
    () =>
      new Set(
        selectedActive.map((s) => `${s.enrollment?.class.id}/${s.enrollment?.section.id}`),
      ).size,
    [selectedActive],
  );
  const selectionSpansScopes = selectionScopes > 1;

  const openDialog = (rows: StudentRecord[]) => {
    if (rows.length === 0) return;
    setTargets(rows);
    setDialogOpen(true);
  };

  // Coming from the student profile: open the dialog for that student once the
  // list has loaded.
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (deepLinkHandled.current || students.length === 0) return;
    const wanted = searchParams.get("studentId");
    if (!wanted) return;
    const student = students.find((s) => s.id === wanted);
    if (!student) return;
    deepLinkHandled.current = true;
    openDialog([student]);
  }, [students, searchParams]);

  const historyColumns = useMemo<ColumnDef<HistoryRow>[]>(
    () => [
      {
        header: "Student",
        accessorKey: "promotedAt",
        cell: (row) => (
          <button
            type="button"
            onClick={() => navigate(`/students/${row.studentId}`)}
            className="text-xs font-semibold text-foreground hover:text-blue-600 hover:underline"
          >
            {row.student.firstName} {row.student.lastName}
            <span className="ml-1 font-normal text-[11px] text-muted-foreground">
              {row.student.admissionNumber}
            </span>
          </button>
        ),
      },
      {
        header: "Outcome",
        cell: (row) => (
          <Badge variant={OUTCOME_BADGE[row.outcome] ?? "secondary"}>
            {PROMOTION_OUTCOME_LABELS[row.outcome] ?? row.outcome}
          </Badge>
        ),
      },
      {
        header: "From",
        cell: (row) => (
          <p className="text-xs text-foreground">
            {row.fromClass.name} · {row.fromSection.name}
            <span className="block text-[10px] text-muted-foreground">
              {row.fromSession.name} · roll {row.fromRollNumber ?? "—"}
            </span>
          </p>
        ),
      },
      {
        header: "To",
        cell: (row) =>
          row.toClass ? (
            <p className="text-xs text-foreground">
              {row.toClass.name} · {row.toSection?.name ?? "—"}
              <span className="block text-[10px] text-muted-foreground">
                {row.toSession.name} · roll {row.toRollNumber ?? "—"}
              </span>
            </p>
          ) : (
            <span className="text-[11px] text-muted-foreground">No new enrollment</span>
          ),
      },
      {
        header: "Done by",
        cell: (row) => (
          <p className="text-xs text-foreground">
            {row.promotedBy.username}
            <span className="block text-[10px] text-muted-foreground">
              {new Date(row.promotedAt).toLocaleDateString()}
            </span>
          </p>
        ),
      },
    ],
    [navigate],
  );

  if (!canPromote) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-card p-10 text-center">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
        <div>
          <h1 className="text-sm font-semibold text-foreground">No promotion access</h1>
          <p className="text-xs text-muted-foreground">
            Your role does not include the <span className="font-mono">students.promote</span> permission.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/students")} className="text-xs">
          Back to students
        </Button>
      </div>
    );
  }

  const allSelected = selectableVisible.length > 0 && selectableVisible.every((s) => selected.has(s.id));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
          <GraduationCap className="h-5 w-5" /> Student Promotion
        </h1>
        <p className="text-xs text-muted-foreground">
          Pick the class, then promote one student or the whole section. Past records are kept and bus
          or hostel seats carry over.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Session
          </span>
          <select
            value={sessionId}
            onChange={(e) => {
              setSessionId(e.target.value);
              setClassId("");
              setSectionId("");
            }}
            disabled={loading || !scope}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-50"
          >
            <option value="">All sessions</option>
            {(scope?.sessions ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.isCurrent ? "(current)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Class
          </span>
          <select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId("");
            }}
            disabled={!sessionId || classes.length === 0}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-50"
          >
            <option value="">All classes</option>
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
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={!classId || sections.length === 0}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-50"
          >
            <option value="">All sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or admission no."
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          />
        </label>
      </div>

      {/* Bulk bar */}
      {selectedActive.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
          <span className="text-xs font-semibold text-blue-900 dark:text-blue-200">
            {selectedActive.length} student(s) selected
          </span>
          <Button
            onClick={() => openDialog(selectedActive)}
            disabled={selectionSpansScopes}
            className="bg-blue-600 text-xs hover:bg-blue-700 disabled:opacity-50"
          >
            <Users className="mr-1.5 h-3.5 w-3.5" /> Promote selected
          </Button>
          <Button variant="outline" onClick={() => setSelected(new Set())} className="text-xs">
            Clear
          </Button>
          {selectionSpansScopes && (
            <span className="text-[11px] text-amber-700 dark:text-amber-300">
              Bulk promotion works on one class and section at a time — filter by section first.
            </span>
          )}
        </div>
      )}

      {/* Student list */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <p className="text-xs font-semibold text-foreground">
            {active.length} active student(s)
            {active.length !== students.length && ` · ${students.length - active.length} already promoted or closed`}
          </p>
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              className="accent-blue-600"
              checked={allSelected}
              onChange={(e) =>
                setSelected(
                  e.target.checked ? new Set(selectableVisible.map((s) => s.id)) : new Set(),
                )
              }
            />
            Select all
          </label>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 p-8 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading students...
          </div>
        ) : visible.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No students found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="w-8 px-3 py-2" />
                  <th className="px-3 py-2 font-semibold">Student</th>
                  <th className="px-3 py-2 font-semibold">Class · Section</th>
                  <th className="px-3 py-2 font-semibold">Roll</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((student) => {
                  const isActive = activeIds.has(student.id);
                  return (
                    <tr key={student.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="accent-blue-600"
                          disabled={!isActive}
                          checked={isActive && selected.has(student.id)}
                          onChange={(e) =>
                            setSelected((current) => {
                              const next = new Set(current);
                              if (e.target.checked) next.add(student.id);
                              else next.delete(student.id);
                              return next;
                            })
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/students/${student.id}`)}
                          className="font-semibold text-foreground hover:text-blue-600 hover:underline"
                        >
                          {student.firstName} {student.lastName}
                        </button>
                        <span className="ml-1 text-[11px] text-muted-foreground">
                          {student.admissionNumber}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-foreground">
                        {student.enrollment
                          ? `${student.enrollment.class.name} · ${student.enrollment.section.name}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-foreground">
                        {student.enrollment?.rollNumber ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        <StatusChip status={student.enrollment?.status ?? student.status} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!isActive}
                          onClick={() => openDialog([student])}
                          className="text-xs disabled:opacity-40"
                        >
                          Promote
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Recent promotions</p>
          <EnterpriseTable
            data={history}
            columns={historyColumns}
            searchPlaceholder="Search by student or admission number..."
            exportFilename="promotion_history"
          />
        </div>
      )}

      <PromoteStudentsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        accessToken={accessToken}
        scope={scope}
        students={targets}
        onDone={() => {
          loadStudents();
          loadHistory();
        }}
      />
    </div>
  );
}
