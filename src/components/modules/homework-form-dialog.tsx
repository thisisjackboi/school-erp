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
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

import { useAuth } from "@/lib/auth/auth-context";
import { useRole } from "@/lib/permissions";
import { formatDisplayDate, toDateInputValue } from "@/lib/dates";
import { getAcademicSessions } from "@/lib/api/academic-sessions.api";
import { getClasses } from "@/lib/api/classes.api";
import { getSections } from "@/lib/api/sections.api";
import {
  createHomework,
  getHomeworkAssignmentOptions,
  updateHomework,
} from "@/lib/api/homework.api";

import type { AcademicSession } from "@/lib/types/academic-session";
import type { SchoolClass } from "@/lib/types/class";
import type { Section } from "@/lib/types/section";
import type { Homework, HomeworkAssignmentOption } from "@/lib/types/homework";
import { HOMEWORK_PERMISSIONS } from "@/lib/types/homework";

import {
  LIMITS,
  firstError,
  trimMax,
  validateMaxLength,
  validateRequired,
} from "@/lib/input-restrictions";

interface HomeworkFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homework?: Homework | null;
  onSuccess?: () => void;
}

const EMPTY_FORM = {
  academicSessionId: "",
  classId: "",
  sectionId: "",
  subjectId: "",
  teacherEmployeeId: "",
  title: "",
  description: "",
  assignedDate: "",
  dueDate: "",
};

const selectClass =
  "w-full h-9 rounded-md border border-input bg-background px-3 text-xs";

export function HomeworkFormDialog({
  open,
  onOpenChange,
  homework = null,
  onSuccess,
}: HomeworkFormDialogProps) {
  const { accessToken } = useAuth();
  const { hasPermission } = useRole();
  const { toast } = useToast();

  const isEditMode = !!homework;
  // Only an administrator may hand homework to another teacher, so the teacher
  // picker is hidden for anyone holding just the self-scoped code.
  const canAssignToOthers = hasPermission(HOMEWORK_PERMISSIONS.create);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [options, setOptions] = useState<HomeworkAssignmentOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      ...EMPTY_FORM,
      assignedDate: toDateInputValue(new Date()),
    });
    setOptions([]);
    setError(null);
  };

  useEffect(() => {
    if (!open || !accessToken) {
      return;
    }

    setError(null);
    setOptions([]);

    if (homework) {
      const assignment = homework.teacherSubjectAssignment;

      setFormData({
        academicSessionId: assignment.academicSessionId,
        classId: assignment.section.class.id,
        sectionId: assignment.sectionId,
        subjectId: assignment.subjectId,
        teacherEmployeeId: assignment.employeeId,
        title: homework.title,
        description: homework.description ?? "",
        assignedDate: toDateInputValue(homework.assignedDate),
        dueDate: toDateInputValue(homework.dueDate),
      });
    } else {
      // Prefill "Assigned on" so the form shows exactly the date that will be
      // submitted, instead of rendering blank and quietly sending today.
      // The academic year is applied below, once the lookups have loaded.
      setFormData({
        ...EMPTY_FORM,
        assignedDate: toDateInputValue(new Date()),
      });
    }

    const loadLookups = async () => {
      try {
        const [sessionList, classList, sectionList] = await Promise.all([
          getAcademicSessions(accessToken),
          getClasses(accessToken),
          getSections(accessToken),
        ]);

        setSessions(sessionList);
        setClasses(classList);
        setSections(sectionList);

        // A new assignment starts in the current academic year; editing keeps
        // the year the homework was actually assigned in.
        if (!homework) {
          const current = sessionList.find((session) => session.isCurrent);

          if (current) {
            setFormData((previous) => ({
              ...previous,
              academicSessionId: current.id,
            }));
          }
        }
      } catch {
        setSessions([]);
        setClasses([]);
        setSections([]);
      }
    };

    void loadLookups();
  }, [open, accessToken, homework]);

  // The assignment list is what actually restricts the form: a teacher receives
  // only their own rows, so their subject list cannot contain anything else.
  useEffect(() => {
    if (!open || !accessToken || !formData.sectionId) {
      setOptions([]);
      return;
    }

    const loadOptions = async () => {
      setIsLoadingOptions(true);

      try {
        setOptions(
          await getHomeworkAssignmentOptions(
            { sectionId: formData.sectionId },
            accessToken,
          ),
        );
      } catch {
        setOptions([]);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    void loadOptions();
  }, [open, accessToken, formData.sectionId]);

  const availableSubjects = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; code: string }>();

    for (const option of options) {
      if (!seen.has(option.subject.id)) {
        seen.set(option.subject.id, option.subject);
      }
    }

    return [...seen.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [options]);

  // For an administrator, only teachers who actually teach the chosen subject in
  // this section/year remain selectable.
  const availableTeachers = useMemo(() => {
    if (!canAssignToOthers) {
      return [];
    }

    const seen = new Map<string, HomeworkAssignmentOption["employee"]>();

    for (const option of options) {
      if (option.subjectId !== formData.subjectId) continue;
      if (!seen.has(option.employee.id)) {
        seen.set(option.employee.id, option.employee);
      }
    }

    return [...seen.values()].sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`,
      ),
    );
  }, [options, formData.subjectId, canAssignToOthers]);

  const selectedSection = sections.find(
    (section) => section.id === formData.sectionId,
  );

  const visibleSections = sections.filter(
    (section) =>
      section.classId === formData.classId &&
      section.academicSessionId === formData.academicSessionId,
  );

  const updateField = (field: keyof typeof EMPTY_FORM, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
      // Changing any parent clears the dependent selections, otherwise a stale
      // subject/teacher could be submitted against the wrong section.
      ...(field === "academicSessionId"
        ? { classId: "", sectionId: "", subjectId: "", teacherEmployeeId: "" }
        : {}),
      ...(field === "classId"
        ? { sectionId: "", subjectId: "", teacherEmployeeId: "" }
        : {}),
      ...(field === "sectionId"
        ? { subjectId: "", teacherEmployeeId: "" }
        : {}),
      ...(field === "subjectId" ? { teacherEmployeeId: "" } : {}),
    }));
  };

  const selectedAssignment = useMemo(() => {
    return options.find(
      (option) =>
        option.subjectId === formData.subjectId &&
        (!canAssignToOthers ||
          option.employeeId === formData.teacherEmployeeId),
    );
  }, [options, formData.subjectId, formData.teacherEmployeeId, canAssignToOthers]);

  const validate = (): string | null => {
    if (!formData.academicSessionId) {
      return "Please select an academic year.";
    }
    if (!formData.classId) {
      return "Please select a class.";
    }
    if (!formData.sectionId) {
      return "Please select a section.";
    }
    if (!formData.subjectId) {
      return "Please select a subject.";
    }
    if (canAssignToOthers && !formData.teacherEmployeeId) {
      return "Please select the teacher who takes this subject.";
    }
    if (!selectedAssignment) {
      return "This subject is not assigned to a teacher for the selected section.";
    }
    if (!formData.dueDate) {
      return "Please select a due date.";
    }
    if (
      formData.assignedDate &&
      formData.dueDate &&
      formData.dueDate < formData.assignedDate
    ) {
      return "The due date cannot be earlier than the assigned date.";
    }

    return firstError(
      validateRequired(formData.title, "Homework title"),
      validateMaxLength(formData.title, "Homework title", LIMITS.TEXT_MAX),
      validateRequired(formData.description, "Instructions"),
      validateMaxLength(
        formData.description,
        "Instructions",
        LIMITS.REMARKS_MAX,
      ),
    );
  };

  const handleSubmit = async () => {
    if (!accessToken) {
      setError("Authentication session expired. Please login again.");
      return;
    }

    const validationError = validate();

    if (validationError || !selectedAssignment) {
      setError(validationError ?? "Please complete the required fields.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      teacherSubjectAssignmentId: selectedAssignment.id,
      title: formData.title.trim(),
      description: formData.description.trim(),
      assignedDate: formData.assignedDate
        ? formData.assignedDate
        : toDateInputValue(new Date()),
      dueDate: formData.dueDate,
    };

    try {
      if (isEditMode && homework) {
        await updateHomework(homework.id, payload, accessToken);
        toast(
          "Homework updated",
          `“${payload.title}” has been updated.`,
          "success",
        );
      } else {
        await createHomework(payload, accessToken);
        toast(
          "Homework assigned",
          `“${payload.title}” is now visible to the class.`,
          "success",
        );
      }

      resetForm();
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save homework";

      setError(message);
      toast("Failed to save homework", message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = (value: boolean) => {
    if (isSaving) {
      return;
    }

    onOpenChange(value);

    if (!value) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogHeader>
        <DialogTitle>
          {isEditMode ? "Edit Homework" : "Assign Homework"}
        </DialogTitle>

        <DialogDescription>
          {canAssignToOthers
            ? "Pick the year, class and section, then choose the subject and its assigned teacher."
            : "Pick the year, class and section. The subjects listed are the ones you teach."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 text-xs">
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block font-semibold">Academic Year *</label>

            <select
              value={formData.academicSessionId}
              onChange={(event) =>
                updateField("academicSessionId", event.target.value)
              }
              disabled={isSaving}
              className={selectClass}
            >
              <option value="">Select academic year</option>

              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                  {session.isCurrent ? " (current)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-semibold">Class *</label>

            <select
              value={formData.classId}
              onChange={(event) =>
                updateField("classId", event.target.value)
              }
              disabled={isSaving || !formData.academicSessionId}
              className={selectClass}
            >
              <option value="">
                {!formData.academicSessionId
                  ? "Select a year first"
                  : "Select class"}
              </option>

              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block font-semibold">Section *</label>

          <select
            value={formData.sectionId}
            onChange={(event) =>
              updateField("sectionId", event.target.value)
            }
            disabled={isSaving || !formData.classId}
            className={selectClass}
          >
            <option value="">
              {formData.classId ? "Select section" : "Select a class first"}
            </option>

            {visibleSections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </div>

        <div
          className={`grid gap-3 ${canAssignToOthers ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
        >
          <div className="space-y-2">
            <label className="block font-semibold">Subject *</label>

            <select
              value={formData.subjectId}
              onChange={(event) =>
                updateField("subjectId", event.target.value)
              }
              disabled={isSaving || !formData.sectionId || isLoadingOptions}
              className={selectClass}
            >
              <option value="">
                {!formData.sectionId
                  ? "Select a section first"
                  : isLoadingOptions
                    ? "Loading subjects..."
                    : options.length === 0
                      ? "No subject assigned here"
                      : "Select subject"}
              </option>

              {availableSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>

          {canAssignToOthers && (
            <div className="space-y-2">
              <label className="block font-semibold">Teacher *</label>

              <select
                value={formData.teacherEmployeeId}
                onChange={(event) =>
                  updateField("teacherEmployeeId", event.target.value)
                }
                disabled={isSaving || !formData.subjectId}
                className={selectClass}
              >
                <option value="">
                  {!formData.subjectId
                    ? "Select a subject first"
                    : "Select teacher"}
                </option>

                {availableTeachers.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} (
                    {employee.employeeCode})
                  </option>
                ))}
              </select>

              <p className="text-[11px] text-muted-foreground">
                Only teachers assigned to this subject in this section are
                listed.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block font-semibold">Homework Title *</label>

          <Input
            value={formData.title}
            onChange={(event) =>
              updateField(
                "title",
                trimMax(event.target.value, LIMITS.TEXT_MAX),
              )
            }
            placeholder="e.g. Chapter 4 numerical problems"
            maxLength={LIMITS.TEXT_MAX}
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label className="block font-semibold">Instructions *</label>

          <textarea
            value={formData.description}
            onChange={(event) =>
              updateField(
                "description",
                trimMax(event.target.value, LIMITS.REMARKS_MAX),
              )
            }
            placeholder="Describe the task, chapter and exercise numbers..."
            rows={4}
            maxLength={LIMITS.REMARKS_MAX}
            disabled={isSaving}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block font-semibold">Assigned on</label>

            <Input
              type="date"
              value={formData.assignedDate}
              onChange={(event) =>
                updateField("assignedDate", event.target.value)
              }
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <label className="block font-semibold">Due on *</label>

            <Input
              type="date"
              value={formData.dueDate}
              onChange={(event) =>
                updateField("dueDate", event.target.value)
              }
              disabled={isSaving}
            />
          </div>
        </div>

        {selectedSection && (
          <p className="text-[11px] text-muted-foreground">
            Target: {selectedSection.class.name}-
            {selectedSection.name} ·{" "}
            {formatDisplayDate(
              selectedSection.academicSession.startDate,
            )}{" "}
            – {formatDisplayDate(selectedSection.academicSession.endDate)}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleClose(false)}
          disabled={isSaving}
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving || isLoadingOptions}
        >
          {isSaving
            ? "Saving..."
            : isEditMode
              ? "Save Changes"
              : "Assign Homework"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
