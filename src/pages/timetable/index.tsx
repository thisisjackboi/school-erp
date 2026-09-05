"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import { getAcademicSessions } from "@/lib/api/academic-sessions.api";
import { getClasses } from "@/lib/api/classes.api";
import { getSections } from "@/lib/api/sections.api";
import { getTeacherSubjectAssignments } from "@/lib/api/teacher-subject-assignments.api";
import { getEmployees } from "@/lib/api/employees.api";
import { getSubjects } from "@/lib/api/subjects.api";
import {
  getPeriods,
  createPeriod,
  updatePeriod,
  deletePeriod,
  getTimetableSlots,
  createTimetableSlot,
  updateTimetableSlot,
  deleteTimetableSlot,
} from "@/lib/api/timetable.api";
import type { AcademicSession } from "@/lib/types/academic-session";
import type { SchoolClass } from "@/lib/types/class";
import type { Section } from "@/lib/types/section";
import type { TeacherSubjectAssignment } from "@/lib/types/teacher-subject-assignment";
import type { Period, TimetableSlot } from "@/lib/types/timetable";
import type { Employee } from "@/lib/types/employee";
import type { Subject } from "@/lib/types/subject";

import {
  LIMITS,
  firstError,
  onlyDigits,
  trimMax,
  validateMaxLength,
  validateNumeric,
  validateRequired,
} from "@/lib/input-restrictions";

import {
  Clock,
  Printer,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Layers,
  Settings,
  ChevronDown,
  BookOpen,
  User,
  X,
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  Check,
} from "lucide-react";

const DAYS_OF_WEEK = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
];

export default function TimetablePage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  // Active view tab: "schedule" grid vs "teacher-matrix" availability
  const [activeTab, setActiveTab] = useState<"schedule" | "teacher-matrix">("schedule");
  const [matrixDay, setMatrixDay] = useState<number>(1);
  const [matrixSearch, setMatrixSearch] = useState<string>("");

  // Reference data
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<TeacherSubjectAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Filter selections for Schedule Grid
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  // Timetable core data
  const [periods, setPeriods] = useState<Period[]>([]);
  const [allSessionSlots, setAllSessionSlots] = useState<TimetableSlot[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);

  // Loaders
  const [loadingRef, setLoadingRef] = useState<boolean>(true);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Period management dialog
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = useState<boolean>(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [periodForm, setPeriodForm] = useState({
    name: "",
    startTime: "08:30",
    endTime: "09:15",
    sortOrder: "1",
  });
  const [submittingPeriod, setSubmittingPeriod] = useState<boolean>(false);

  // Slot management dialog
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState<boolean>(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [slotForm, setSlotForm] = useState({
    periodId: "",
    dayOfWeek: 1,
    teacherSubjectAssignmentId: "",
    room: "",
  });
  const [submittingSlot, setSubmittingSlot] = useState<boolean>(false);

  // Load reference data & periods once
  useEffect(() => {
    if (!accessToken) return;

    const loadInitialData = async () => {
      try {
        setLoadingRef(true);
        const [
          sessionsData,
          classesData,
          sectionsData,
          assignmentsData,
          periodsData,
          employeesData,
          subjectsData,
        ] = await Promise.all([
          getAcademicSessions(accessToken),
          getClasses(accessToken),
          getSections(accessToken),
          getTeacherSubjectAssignments(accessToken),
          getPeriods(accessToken),
          getEmployees(accessToken).catch(() => []),
          getSubjects(accessToken).catch(() => []),
        ]);

        setSessions(sessionsData);
        setClasses(classesData);
        setSections(sectionsData);
        setAssignments(assignmentsData);
        setPeriods(periodsData);
        setEmployees(employeesData);
        setSubjects(subjectsData);

        // Auto-select current session if available
        const currSession = sessionsData.find((s) => s.isCurrent) || sessionsData[0];
        if (currSession) {
          setSelectedSessionId(currSession.id);
        }
      } catch (err) {
        toast(
          "Failed to load reference data",
          err instanceof Error ? err.message : "Unable to load timetable configuration",
          "error",
        );
      } finally {
        setLoadingRef(false);
      }
    };

    loadInitialData();
  }, [accessToken, toast]);

  // Available classes for selected session
  const availableClasses = useMemo(() => {
    if (!selectedSessionId) return classes;
    const classIdsInSession = new Set(
      sections
        .filter((s) => s.academicSessionId === selectedSessionId)
        .map((s) => s.classId),
    );
    return classes.filter((c) => classIdsInSession.has(c.id));
  }, [selectedSessionId, classes, sections]);

  // Available sections for selected session and class
  const availableSections = useMemo(() => {
    return sections.filter(
      (s) =>
        (!selectedSessionId || s.academicSessionId === selectedSessionId) &&
        (!selectedClassId || s.classId === selectedClassId),
    );
  }, [selectedSessionId, selectedClassId, sections]);

  // Auto-select first section if none selected
  useEffect(() => {
    if (availableSections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(availableSections[0].id);
    }
  }, [availableSections, selectedSectionId]);

  // Load all slots for current session
  const loadSlots = useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoadingSlots(true);
      const sessionSlots = await getTimetableSlots(accessToken, {
        ...(selectedSessionId ? { academicSessionId: selectedSessionId } : {}),
      });

      setAllSessionSlots(sessionSlots);

      // Filter slots for active section grid
      if (selectedSectionId) {
        setSlots(
          sessionSlots.filter(
            (s) => s.teacherSubjectAssignment?.sectionId === selectedSectionId,
          ),
        );
      } else {
        setSlots(sessionSlots);
      }
    } catch (err) {
      toast(
        "Failed to load timetable slots",
        err instanceof Error ? err.message : "Unable to fetch slots",
        "error",
      );
    } finally {
      setLoadingSlots(false);
    }
  }, [accessToken, selectedSectionId, selectedSessionId, toast]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  // Helper name resolvers
  const getAssignmentSubjectName = useCallback(
    (a: TeacherSubjectAssignment) => {
      if (a.subject?.name) return `${a.subject.name} (${a.subject.code || ""})`;
      const found = subjects.find((s) => s.id === a.subjectId);
      return found ? `${found.name} (${found.code})` : "Subject";
    },
    [subjects],
  );

  const getAssignmentTeacherName = useCallback(
    (a: TeacherSubjectAssignment) => {
      if (a.employee) return `${a.employee.firstName} ${a.employee.lastName}`;
      const found = employees.find((e) => e.id === a.employeeId);
      return found ? `${found.firstName} ${found.lastName}` : "Teacher";
    },
    [employees],
  );

  // Pre-flight Teacher Conflict Finder
  const getTeacherConflict = useCallback(
    (employeeId: string, dayOfWeek: number, periodId: string, currentSlotId?: string) => {
      if (!employeeId || !dayOfWeek || !periodId) return null;

      const conflictSlot = allSessionSlots.find(
        (s) =>
          s.dayOfWeek === dayOfWeek &&
          s.periodId === periodId &&
          s.id !== currentSlotId &&
          s.teacherSubjectAssignment?.employeeId === employeeId,
      );

      if (!conflictSlot) return null;

      const clsName =
        (conflictSlot.teacherSubjectAssignment?.section as any)?.class?.name ||
        classes.find((c) => c.id === conflictSlot.teacherSubjectAssignment?.section?.classId)?.name ||
        "Class";
      const secName = conflictSlot.teacherSubjectAssignment?.section?.name || "";
      const room = conflictSlot.room ? ` (Room ${conflictSlot.room})` : "";
      const subjName = conflictSlot.teacherSubjectAssignment?.subject?.name || "Subject";

      return {
        isBusy: true,
        busyLocation: `${clsName} - Sec ${secName}${room}`,
        subjectName: subjName,
      };
    },
    [allSessionSlots, classes],
  );

  // Filter teacher-subject assignments for current selection with fallback
  const availableAssignments = useMemo(() => {
    let filtered = assignments;
    if (selectedSessionId) {
      const sessionMatches = filtered.filter(
        (a) => a.academicSessionId === selectedSessionId,
      );
      if (sessionMatches.length > 0) filtered = sessionMatches;
    }
    if (selectedSectionId) {
      const sectionMatches = filtered.filter(
        (a) => a.sectionId === selectedSectionId,
      );
      if (sectionMatches.length > 0) return sectionMatches;
    }
    if (selectedClassId) {
      const classMatches = filtered.filter((a) => {
        const sec = sections.find((s) => s.id === a.sectionId);
        return sec?.classId === selectedClassId;
      });
      if (classMatches.length > 0) return classMatches;
    }
    return filtered;
  }, [selectedSectionId, selectedClassId, selectedSessionId, assignments, sections]);

  // Teaching employees list for Availability Matrix
  const teachingStaff = useMemo(() => {
    const teachers = employees.filter(
      (e) => e.status === "ACTIVE" && e.designation?.category === "TEACHING",
    );
    if (!matrixSearch.trim()) return teachers;
    const q = matrixSearch.toLowerCase();
    return teachers.filter(
      (t) =>
        t.firstName.toLowerCase().includes(q) ||
        t.lastName.toLowerCase().includes(q) ||
        t.employeeCode.toLowerCase().includes(q),
    );
  }, [employees, matrixSearch]);

  // ----------------------------------------------------
  // PERIOD HANDLERS
  // ----------------------------------------------------
  const handleOpenPeriodDialog = (period?: Period) => {
    if (period) {
      setEditingPeriod(period);
      const parseTime = (dateStr: string) => {
        try {
          const d = new Date(dateStr);
          return d.toTimeString().substring(0, 5);
        } catch {
          return "08:30";
        }
      };
      setPeriodForm({
        name: period.name,
        startTime: parseTime(period.startTime),
        endTime: parseTime(period.endTime),
        sortOrder: String(period.sortOrder),
      });
    } else {
      setEditingPeriod(null);
      setPeriodForm({
        name: `Period ${periods.length + 1}`,
        startTime: "08:30",
        endTime: "09:15",
        sortOrder: String(periods.length + 1),
      });
    }
    setIsPeriodDialogOpen(true);
  };

  const handlePeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!periodForm.name.trim()) {
      toast("Period name required", "Please enter a period name.", "error");
      return;
    }

    const sortOrderNumber = parseInt(periodForm.sortOrder, 10);

    const periodError = firstError(
      validateRequired(periodForm.name, "Period name"),
      validateMaxLength(periodForm.name, "Period name", LIMITS.NAME_MAX),
      validateNumeric(periodForm.sortOrder, "Sort order", {
        min: 1,
        max: 1000,
      }),
    );
    if (periodError) {
      toast(periodError, "Please correct the highlighted fields.", "error");
      return;
    }

    if (periodForm.startTime >= periodForm.endTime) {
      toast(
        "Invalid period timings",
        "End time must be after start time.",
        "error",
      );
      return;
    }

    try {
      setSubmittingPeriod(true);
      const today = new Date().toISOString().split("T")[0];
      const startIso = new Date(`${today}T${periodForm.startTime}:00`).toISOString();
      const endIso = new Date(`${today}T${periodForm.endTime}:00`).toISOString();

      if (editingPeriod) {
        await updatePeriod(
          editingPeriod.id,
          {
            name: periodForm.name,
            startTime: startIso,
            endTime: endIso,
            sortOrder: sortOrderNumber,
          },
          accessToken,
        );
        toast("Period Updated", "Timetable period updated successfully.", "success");
      } else {
        await createPeriod(
          {
            name: periodForm.name,
            startTime: startIso,
            endTime: endIso,
            sortOrder: sortOrderNumber,
          },
          accessToken,
        );
        toast("Period Created", "New timetable period added.", "success");
      }

      setIsPeriodDialogOpen(false);
      const freshPeriods = await getPeriods(accessToken);
      setPeriods(freshPeriods);
    } catch (err) {
      toast(
        "Period Operation Failed",
        err instanceof Error ? err.message : "Could not save period",
        "error",
      );
    } finally {
      setSubmittingPeriod(false);
    }
  };

  const handleDeletePeriod = async (periodId: string) => {
    if (!accessToken) return;
    if (!window.confirm("Are you sure you want to delete this period?")) return;

    try {
      await deletePeriod(periodId, accessToken);
      toast("Period Deleted", "Period deleted successfully.", "success");
      const freshPeriods = await getPeriods(accessToken);
      setPeriods(freshPeriods);
    } catch (err) {
      toast(
        "Failed to delete period",
        err instanceof Error ? err.message : "Could not delete period",
        "error",
      );
    }
  };

  // ----------------------------------------------------
  // SLOT HANDLERS
  // ----------------------------------------------------
  const handleOpenSlotDialog = (
    dayOfWeek: number,
    periodId: string,
    existingSlot?: TimetableSlot,
  ) => {
    if (existingSlot) {
      setEditingSlot(existingSlot);
      setSlotForm({
        periodId: existingSlot.periodId,
        dayOfWeek: existingSlot.dayOfWeek,
        teacherSubjectAssignmentId: existingSlot.teacherSubjectAssignmentId,
        room: existingSlot.room || "",
      });
    } else {
      setEditingSlot(null);
      setSlotForm({
        periodId,
        dayOfWeek,
        teacherSubjectAssignmentId: availableAssignments[0]?.id || "",
        room: "",
      });
    }
    setIsSlotDialogOpen(true);
  };

  const handleSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!slotForm.teacherSubjectAssignmentId) {
      toast("Assignment Required", "Please select a Subject & Teacher assignment.", "error");
      return;
    }
    if (!slotForm.periodId) {
      toast("Period Required", "Please select a period.", "error");
      return;
    }

    try {
      setSubmittingSlot(true);

      if (editingSlot) {
        await updateTimetableSlot(
          editingSlot.id,
          {
            teacherSubjectAssignmentId: slotForm.teacherSubjectAssignmentId,
            periodId: slotForm.periodId,
            dayOfWeek: Number(slotForm.dayOfWeek),
            room: slotForm.room.trim() || undefined,
          },
          accessToken,
        );
        toast("Slot Updated", "Timetable slot updated successfully.", "success");
      } else {
        await createTimetableSlot(
          {
            teacherSubjectAssignmentId: slotForm.teacherSubjectAssignmentId,
            periodId: slotForm.periodId,
            dayOfWeek: Number(slotForm.dayOfWeek),
            room: slotForm.room.trim() || undefined,
          },
          accessToken,
        );
        toast("Slot Assigned", "Timetable slot assigned successfully.", "success");
      }

      setIsSlotDialogOpen(false);
      await loadSlots();
    } catch (err) {
      toast(
        "Slot Assignment Error",
        err instanceof Error ? err.message : "Could not assign timetable slot",
        "error",
      );
    } finally {
      setSubmittingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!accessToken) return;
    if (!window.confirm("Are you sure you want to remove this slot assignment?")) return;

    try {
      await deleteTimetableSlot(slotId, accessToken);
      toast("Slot Removed", "Timetable slot removed successfully.", "success");
      setIsSlotDialogOpen(false);
      await loadSlots();
    } catch (err) {
      toast(
        "Failed to remove slot",
        err instanceof Error ? err.message : "Could not remove slot",
        "error",
      );
    }
  };

  // Helper to render period time string
  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const selectedSectionObj = sections.find((s) => s.id === selectedSectionId);
  const selectedClassObj = classes.find((c) => c.id === selectedClassId);

  // Selected assignment conflict in dialog
  const selectedAssignmentObj = availableAssignments.find(
    (a) => a.id === slotForm.teacherSubjectAssignmentId,
  );
  const selectedAssignmentConflict = selectedAssignmentObj
    ? getTeacherConflict(
        selectedAssignmentObj.employeeId,
        slotForm.dayOfWeek,
        slotForm.periodId,
        editingSlot?.id,
      )
    : null;

  const selectedPeriodObj = periods.find((p) => p.id === slotForm.periodId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Interactive Timetable Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Class weekly period schedules, live teacher availability &amp; room matrix.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Active View Switcher */}
          <div className="flex items-center rounded-lg border bg-muted p-1 text-xs">
            <button
              onClick={() => setActiveTab("schedule")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all ${
                activeTab === "schedule"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Class Schedule Grid
            </button>
            <button
              onClick={() => setActiveTab("teacher-matrix")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all ${
                activeTab === "teacher-matrix"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Teacher Availability Matrix
            </button>
          </div>

          <Button
            onClick={() => handleOpenPeriodDialog()}
            variant="outline"
            size="sm"
            className="text-xs border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
          >
            <Settings className="mr-1.5 h-3.5 w-3.5" /> Manage Periods
          </Button>

          <Button onClick={() => window.print()} variant="outline" size="sm" className="text-xs">
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print Schedule
          </Button>
        </div>
      </div>

      {/* VIEW TAB 1: CLASS SCHEDULE GRID */}
      {activeTab === "schedule" && (
        <div className="space-y-6">
          {/* Cascading Filter Header */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Select Class Schedule
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {/* Academic Session */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Academic Session
                </label>
                <div className="relative">
                  <select
                    value={selectedSessionId}
                    onChange={(e) => {
                      setSelectedSessionId(e.target.value);
                      setSelectedClassId("");
                      setSelectedSectionId("");
                    }}
                    disabled={loadingRef}
                    className="h-8 rounded-md border border-input bg-background pl-2 pr-8 text-xs appearance-none cursor-pointer disabled:opacity-50 min-w-[160px]"
                  >
                    <option value="">-- All Sessions --</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.isCurrent ? "★" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              {/* Class */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Class
                </label>
                <div className="relative">
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setSelectedSectionId("");
                    }}
                    disabled={loadingRef || availableClasses.length === 0}
                    className="h-8 rounded-md border border-input bg-background pl-2 pr-8 text-xs appearance-none cursor-pointer disabled:opacity-50 min-w-[140px]"
                  >
                    <option value="">-- Select Class --</option>
                    {availableClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              {/* Section */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Section
                </label>
                <div className="relative">
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    disabled={loadingRef || availableSections.length === 0}
                    className="h-8 rounded-md border border-input bg-background pl-2 pr-8 text-xs appearance-none cursor-pointer disabled:opacity-50 min-w-[140px]"
                  >
                    <option value="">-- Select Section --</option>
                    {availableSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        Section {sec.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              {/* Context pill */}
              {selectedSectionObj && (
                <div className="ml-auto flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                    <Layers className="h-3.5 w-3.5" />
                    {selectedClassObj?.name || "Class"} - Section {selectedSectionObj.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Main Weekly Timetable Grid Card */}
          <Card className="shadow-xs">
            <CardHeader className="py-3.5 px-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Weekly Schedule Grid
                {selectedSectionObj && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    ({selectedClassObj?.name || ""} - Sec {selectedSectionObj.name})
                  </span>
                )}
              </CardTitle>

              <Button
                size="sm"
                onClick={() => handleOpenSlotDialog(1, periods[0]?.id || "")}
                disabled={periods.length === 0 || !selectedSectionId}
                className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Assign New Slot
              </Button>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {periods.length === 0 ? (
                <div className="p-12 text-center text-xs space-y-3">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="font-semibold text-foreground">No Periods Configured</p>
                  <p className="text-muted-foreground text-[11px] max-w-sm mx-auto">
                    Set up school periods (e.g. Period 1: 08:30-09:15) to start creating weekly class schedules.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleOpenPeriodDialog()}
                    className="bg-blue-600 hover:bg-blue-700 text-xs"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Create First Period
                  </Button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900 border-b">
                      <th className="p-3 border font-bold text-muted-foreground w-28 text-center">
                        Period
                      </th>
                      {DAYS_OF_WEEK.map((day) => (
                        <th
                          key={day.id}
                          className="p-3 border text-center font-bold text-slate-800 dark:text-slate-200"
                        >
                          {day.name}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {periods.map((period) => (
                      <tr key={period.id} className="border-b hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        {/* Period Header Column */}
                        <td className="p-2.5 border text-center font-semibold bg-slate-50 dark:bg-slate-900/80">
                          <div className="text-slate-900 dark:text-slate-100 font-bold">
                            {period.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                            {formatTime(period.startTime)} - {formatTime(period.endTime)}
                          </div>
                        </td>

                        {/* Day Cells */}
                        {DAYS_OF_WEEK.map((day) => {
                          const slot = slots.find(
                            (s) => s.periodId === period.id && s.dayOfWeek === day.id,
                          );

                          const emp = slot?.teacherSubjectAssignment?.employee;
                          const subj = slot?.teacherSubjectAssignment?.subject;

                          return (
                            <td key={day.id} className="p-1.5 border text-center align-top h-20">
                              {slot ? (
                                <div
                                  onClick={() => handleOpenSlotDialog(day.id, period.id, slot)}
                                  className="group relative p-2 rounded-md bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer text-left h-full flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-blue-950 dark:text-blue-200 text-[11px] truncate">
                                        {subj?.name || "Subject"}
                                      </span>
                                      {subj?.code && (
                                        <span className="text-[9px] px-1 py-0.2 bg-blue-200/60 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded font-mono">
                                          {subj.code}
                                        </span>
                                      )}
                                    </div>

                                    {emp && (
                                      <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium mt-1 truncate">
                                        👤 {emp.firstName} {emp.lastName}
                                      </p>
                                    )}
                                  </div>

                                  <div className="mt-1 flex items-center justify-between text-[9px] text-muted-foreground pt-1 border-t border-blue-100 dark:border-blue-900/50">
                                    <span>{slot.room ? `Room: ${slot.room}` : "No Room"}</span>
                                    <Pencil className="h-3 w-3 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleOpenSlotDialog(day.id, period.id)}
                                  disabled={!selectedSectionId}
                                  className="w-full h-full min-h-[64px] rounded border border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-muted-foreground hover:text-blue-600 flex flex-col items-center justify-center gap-1 transition-colors text-[10px] p-2 disabled:opacity-40"
                                >
                                  <Plus className="h-3.5 w-3.5 opacity-60" />
                                  <span>Assign Slot</span>
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW TAB 2: TEACHER AVAILABILITY MATRIX */}
      {activeTab === "teacher-matrix" && (
        <Card className="shadow-xs space-y-4">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  Master Teacher Schedule &amp; Period Availability Matrix
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  View free vs occupied periods for all teachers across the school for any day.
                </p>
              </div>

              {/* Day & Search Filters */}
              <div className="flex items-center gap-2">
                <div className="relative min-w-[180px]">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search teacher name..."
                    value={matrixSearch}
                    onChange={(e) => setMatrixSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                <div className="relative">
                  <select
                    value={matrixDay}
                    onChange={(e) => setMatrixDay(parseInt(e.target.value) || 1)}
                    className="h-8 rounded-md border border-input bg-background pl-3 pr-8 text-xs font-semibold appearance-none cursor-pointer"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            {periods.length === 0 ? (
              <p className="p-8 text-center text-xs text-muted-foreground">
                No periods configured. Configure periods to view teacher availability.
              </p>
            ) : teachingStaff.length === 0 ? (
              <p className="p-8 text-center text-xs text-muted-foreground">
                No teaching employees found.
              </p>
            ) : (
              <table className="w-full text-left border-collapse text-xs min-w-[800px]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b">
                    <th className="p-3 border font-bold text-slate-900 dark:text-slate-100 min-w-[180px]">
                      Teacher
                    </th>
                    {periods.map((p) => (
                      <th key={p.id} className="p-2.5 border text-center font-bold text-muted-foreground">
                        {p.name}
                        <div className="text-[9px] font-normal text-muted-foreground">
                          {formatTime(p.startTime)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {teachingStaff.map((teacher) => (
                    <tr key={teacher.id} className="border-b hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="p-3 border font-medium">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {teacher.firstName} {teacher.lastName}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {teacher.employeeCode}
                        </div>
                      </td>

                      {periods.map((period) => {
                        const conflict = getTeacherConflict(teacher.id, matrixDay, period.id);

                        return (
                          <td key={period.id} className="p-2 border text-center align-middle">
                            {conflict ? (
                              <div className="p-1.5 rounded bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-200 text-[10px] font-medium leading-tight">
                                <p className="font-bold truncate">{conflict.subjectName}</p>
                                <p className="text-[9px] text-purple-800 dark:text-purple-300 truncate">
                                  {conflict.busyLocation}
                                </p>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded">
                                <Check className="h-3 w-3" /> FREE
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---------------------------------------------------- */}
      {/* PERIOD MANAGEMENT DIALOG                             */}
      {/* ---------------------------------------------------- */}
      <Dialog open={isPeriodDialogOpen} onOpenChange={setIsPeriodDialogOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4 text-blue-600" />
            {editingPeriod ? "Edit School Period" : "Configure School Periods"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Manage period timings &amp; sequence order for timetable scheduling.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handlePeriodSubmit} className="space-y-4 text-xs mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Period Name *</label>
              <Input
                placeholder="e.g. Period 1 or Lunch Break"
                value={periodForm.name}
                onChange={(e) =>
                  setPeriodForm({
                    ...periodForm,
                    name: trimMax(e.target.value, LIMITS.NAME_MAX),
                  })
                }
                maxLength={LIMITS.NAME_MAX}
                disabled={submittingPeriod}
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Sort Order *</label>
              <Input
                inputMode="numeric"
                pattern="[0-9]*"
                value={periodForm.sortOrder}
                onChange={(e) =>
                  setPeriodForm({
                    ...periodForm,
                    sortOrder: onlyDigits(e.target.value, 4),
                  })
                }
                maxLength={4}
                placeholder="1-1000"
                disabled={submittingPeriod}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Start Time *</label>
              <Input
                type="time"
                value={periodForm.startTime}
                onChange={(e) => setPeriodForm({ ...periodForm, startTime: e.target.value })}
                disabled={submittingPeriod}
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">End Time *</label>
              <Input
                type="time"
                value={periodForm.endTime}
                onChange={(e) => setPeriodForm({ ...periodForm, endTime: e.target.value })}
                disabled={submittingPeriod}
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t flex items-center justify-between">
            {editingPeriod ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  setIsPeriodDialogOpen(false);
                  handleDeletePeriod(editingPeriod.id);
                }}
                disabled={submittingPeriod}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPeriodDialogOpen(false)}
                disabled={submittingPeriod}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingPeriod}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {submittingPeriod
                  ? "Saving..."
                  : editingPeriod
                  ? "Update Period"
                  : "Add Period"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </Dialog>

      {/* ---------------------------------------------------- */}
      {/* SLOT ASSIGNMENT DIALOG WITH PRE-FLIGHT AVAILABILITY  */}
      {/* ---------------------------------------------------- */}
      <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-blue-600" />
            {editingSlot ? "Edit Timetable Slot" : "Assign Timetable Slot"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Assign subject teacher, room &amp; period for{" "}
            <strong className="text-foreground">
              {selectedClassObj?.name || ""} - Section {selectedSectionObj?.name || ""}
            </strong>
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSlotSubmit} className="space-y-4 text-xs mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Day of Week *</label>
              <select
                value={slotForm.dayOfWeek}
                onChange={(e) =>
                  setSlotForm({ ...slotForm, dayOfWeek: parseInt(e.target.value) || 1 })
                }
                disabled={submittingSlot}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">Period *</label>
              <select
                value={slotForm.periodId}
                onChange={(e) => setSlotForm({ ...slotForm, periodId: e.target.value })}
                disabled={submittingSlot}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">-- Select Period --</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatTime(p.startTime)} - {formatTime(p.endTime)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject & Teacher Selection with Live Availability Indicators */}
          <div>
            <label className="font-semibold block mb-1">
              Subject &amp; Assigned Teacher *
            </label>
            <select
              value={slotForm.teacherSubjectAssignmentId}
              onChange={(e) =>
                setSlotForm({ ...slotForm, teacherSubjectAssignmentId: e.target.value })
              }
              disabled={submittingSlot || availableAssignments.length === 0}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">-- Select Subject &amp; Teacher --</option>
              {availableAssignments.map((a) => {
                const conflict = getTeacherConflict(
                  a.employeeId,
                  slotForm.dayOfWeek,
                  slotForm.periodId,
                  editingSlot?.id,
                );
                const subjName = getAssignmentSubjectName(a);
                const teacherName = getAssignmentTeacherName(a);

                return (
                  <option
                    key={a.id}
                    value={a.id}
                    className={conflict ? "text-amber-700 bg-amber-50 font-semibold" : ""}
                  >
                    {conflict ? `⚠️ [BUSY: ${conflict.busyLocation}] ` : "🟢 [AVAILABLE] "}
                    {subjName} — {teacherName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* PRE-FLIGHT LIVE CONFLICT / AVAILABILITY STATUS BANNER */}
          {selectedAssignmentConflict ? (
            <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1">
                  Schedule Conflict Warning!
                </p>
                <p className="text-[11px] mt-0.5 text-amber-800 dark:text-amber-300">
                  This teacher is already teaching <strong>{selectedAssignmentConflict.subjectName}</strong> in <strong>{selectedAssignmentConflict.busyLocation}</strong> during {selectedPeriodObj?.name || "this period"} on {DAYS_OF_WEEK.find((d) => d.id === slotForm.dayOfWeek)?.name}.
                </p>
              </div>
            </div>
          ) : slotForm.teacherSubjectAssignmentId ? (
            <div className="p-2.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-[11px] flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Teacher is <strong>AVAILABLE</strong> during this period with zero schedule collisions.</span>
            </div>
          ) : null}

          <div>
            <label className="font-semibold block mb-1">Room / Lab (Optional)</label>
            <Input
              placeholder="e.g. Room 102 or Physics Lab"
              value={slotForm.room}
              onChange={(e) =>
                setSlotForm({ ...slotForm, room: trimMax(e.target.value, LIMITS.TEXT_MAX) })
              }
              maxLength={LIMITS.TEXT_MAX}
              disabled={submittingSlot}
            />
          </div>

          <DialogFooter className="pt-3 border-t flex items-center justify-between">
            {editingSlot ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteSlot(editingSlot.id)}
                disabled={submittingSlot}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove Slot
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSlotDialogOpen(false)}
                disabled={submittingSlot}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingSlot || availableAssignments.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {submittingSlot
                  ? "Saving..."
                  : editingSlot
                  ? "Update Slot"
                  : "Save Slot"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
