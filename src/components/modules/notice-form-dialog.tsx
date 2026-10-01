"use client";

import React, { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";

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
import { toDateInputValue } from "@/lib/dates";
import { createNotice, updateNotice } from "@/lib/api/notices.api";
import { getClasses } from "@/lib/api/classes.api";

import type { SchoolClass } from "@/lib/types/class";
import type {
  Notice,
  NoticeAudience,
  NoticeCategory,
} from "@/lib/types/notice";
import {
  NOTICE_AUDIENCE_OPTIONS,
  NOTICE_CATEGORY_OPTIONS,
} from "@/lib/types/notice";

import {
  LIMITS,
  firstError,
  trimMax,
  validateMaxLength,
  validateRequired,
} from "@/lib/input-restrictions";

interface NoticeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notice?: Notice | null;
  onSuccess?: () => void;
}

const EMPTY_FORM = {
  title: "",
  body: "",
  audience: "ALL" as NoticeAudience,
  category: "GENERAL" as NoticeCategory,
  classId: "",
  expiresAt: "",
};

export function NoticeFormDialog({
  open,
  onOpenChange,
  notice = null,
  onSuccess,
}: NoticeFormDialogProps) {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!notice;

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setError(null);
  };

  useEffect(() => {
    if (!open || !accessToken) {
      return;
    }

    setError(null);

    if (notice) {
      setFormData({
        title: notice.title ?? "",
        body: notice.body ?? "",
        audience: notice.audience,
        category: notice.category,
        classId: notice.classId ?? "",
        expiresAt: notice.expiresAt
          ? toDateInputValue(notice.expiresAt)
          : "",
      });
    } else {
      setFormData(EMPTY_FORM);
    }

    const loadClasses = async () => {
      setIsLoadingOptions(true);

      try {
        setClasses(await getClasses(accessToken));
      } catch {
        // The class dropdown is only required for SPECIFIC_CLASS notices, so a
        // failure here should not block the whole dialog.
        setClasses([]);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    void loadClasses();
  }, [open, accessToken, notice]);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
      // A class only applies to a class-specific notice, so switching the
      // audience away from that clears the stale class.
      ...(field === "audience" && value !== "SPECIFIC_CLASS"
        ? { classId: "" }
        : {}),
    }));
  };

  const validate = (): string | null => {
    if (
      formData.audience === "SPECIFIC_CLASS" &&
      !formData.classId
    ) {
      return "Please select a class for a class-specific notice.";
    }

    return firstError(
      validateRequired(formData.title, "Notice title"),
      validateMaxLength(
        formData.title,
        "Notice title",
        LIMITS.TEXT_MAX,
      ),
      validateRequired(formData.body, "Notice body"),
      validateMaxLength(
        formData.body,
        "Notice body",
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

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      title: formData.title.trim(),
      body: formData.body.trim(),
      audience: formData.audience,
      category: formData.category,
      // The backend rejects a classId for any audience other than
      // SPECIFIC_CLASS, so only send it when it applies.
      ...(formData.audience === "SPECIFIC_CLASS" && formData.classId
        ? { classId: formData.classId }
        : {}),
      ...(formData.expiresAt ? { expiresAt: formData.expiresAt } : {}),
    };

    try {
      if (isEditMode && notice) {
        await updateNotice(notice.id, payload, accessToken);
        toast(
          "Notice Updated",
          `“${payload.title}” has been updated.`,
          "success",
        );
      } else {
        await createNotice(payload, accessToken);
        toast(
          "Notice Published",
          `“${payload.title}” is now live on the notice board.`,
          "success",
        );
      }

      resetForm();
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save notice";

      setError(message);
      toast("Failed to save notice", message, "error");
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
        <DialogTitle className="flex items-center space-x-2">
          <Megaphone className="h-5 w-5 text-blue-600" />
          <span>
            {isEditMode ? "Edit Notice" : "Publish Notice"}
          </span>
        </DialogTitle>

        <DialogDescription>
          {isEditMode
            ? "Update this notice for the selected audience."
            : "Publish a circular to students, employees, guardians or everyone."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 text-xs">
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="font-semibold block">Title *</label>

          <Input
            value={formData.title}
            onChange={(event) =>
              updateField(
                "title",
                trimMax(event.target.value, LIMITS.TEXT_MAX),
              )
            }
            placeholder="e.g. Annual Sports Day"
            maxLength={LIMITS.TEXT_MAX}
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label className="font-semibold block">Body *</label>

          <textarea
            value={formData.body}
            onChange={(event) =>
              updateField(
                "body",
                trimMax(
                  event.target.value,
                  LIMITS.REMARKS_MAX,
                ),
              )
            }
            placeholder="Write the full circular here..."
            rows={5}
            maxLength={LIMITS.REMARKS_MAX}
            disabled={isSaving}
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="font-semibold block">
              Audience *
            </label>

            <select
              value={formData.audience}
              onChange={(event) =>
                updateField(
                  "audience",
                  event.target.value,
                )
              }
              disabled={isSaving}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              {NOTICE_AUDIENCE_OPTIONS.map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-semibold block">
              Category *
            </label>

            <select
              value={formData.category}
              onChange={(event) =>
                updateField(
                  "category",
                  event.target.value,
                )
              }
              disabled={isSaving}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              {NOTICE_CATEGORY_OPTIONS.map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {formData.audience === "SPECIFIC_CLASS" && (
          <div className="space-y-2">
            <label className="font-semibold block">
              Class *
            </label>

            <select
              value={formData.classId}
              onChange={(event) =>
                updateField(
                  "classId",
                  event.target.value,
                )
              }
              disabled={isSaving || isLoadingOptions}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">
                {isLoadingOptions
                  ? "Loading classes..."
                  : "Select class"}
              </option>

              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="font-semibold block">
            Expires on
          </label>

          <Input
            type="date"
            value={formData.expiresAt}
            onChange={(event) =>
              updateField("expiresAt", event.target.value)
            }
            disabled={isSaving}
          />

          <p className="text-[11px] text-muted-foreground">
            Leave empty to keep the notice visible until it is
            deleted.
          </p>
        </div>
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
          disabled={isSaving}
        >
          {isSaving
            ? "Saving..."
            : isEditMode
              ? "Save Changes"
              : "Publish"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
