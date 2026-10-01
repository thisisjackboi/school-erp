"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Megaphone,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import { PermissionGate } from "@/components/auth/permission-gate";
import { NoticeFormDialog } from "@/components/modules/notice-form-dialog";

import { useAuth } from "@/lib/auth/auth-context";
import { formatDisplayDate } from "@/lib/dates";
import { getNotices, deleteNotice } from "@/lib/api/notices.api";

import type {
  Notice,
  NoticeAudience,
  NoticeCategory,
} from "@/lib/types/notice";
import {
  NOTICE_AUDIENCE_LABELS,
  NOTICE_AUDIENCE_OPTIONS,
  NOTICE_CATEGORY_LABELS,
  NOTICE_CATEGORY_OPTIONS,
} from "@/lib/types/notice";

const PAGE_LIMIT = 20;

export default function AnnouncementsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  const [deletingNotice, setDeletingNotice] = useState<Notice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadNotices = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const result = await getNotices(
        {
          page,
          limit: PAGE_LIMIT,
          search: search.trim() || undefined,
          audience: (audienceFilter || undefined) as
            | NoticeAudience
            | undefined,
          category: (categoryFilter || undefined) as
            | NoticeCategory
            | undefined,
        },
        accessToken,
      );

      setNotices(result.items);
      setTotal(result.meta.total);
      setTotalPages(Math.max(1, result.meta.totalPages));
    } catch (error) {
      toast(
        "Failed to load notices",
        error instanceof Error
          ? error.message
          : "Failed to load notices",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, page, search, audienceFilter, categoryFilter, toast]);

  useEffect(() => {
    void loadNotices();
  }, [loadNotices]);

  const handleCreate = () => {
    setEditingNotice(null);
    setIsFormOpen(true);
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingNotice || !accessToken) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteNotice(deletingNotice.id, accessToken);

      toast(
        "Notice deleted",
        `“${deletingNotice.title}” has been removed.`,
        "success",
      );

      setDeletingNotice(null);

      // Deleting the only row on the last page should land on a valid page.
      if (notices.length === 1 && page > 1) {
        setPage((current) => current - 1);
        return;
      }

      await loadNotices();
    } catch (error) {
      toast(
        "Failed to delete notice",
        error instanceof Error
          ? error.message
          : "Failed to delete notice",
        "error",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Notice Board &amp; Circulars
          </h1>
          <p className="text-xs text-muted-foreground">
            Publish circulars, exam and fee announcements to
            students, parents and staff.
          </p>
        </div>

        <PermissionGate permission="notices.create">
          <Button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Publish Notice
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-sm">
              All Notices
              {total > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {total} total
                </span>
              )}
            </CardTitle>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search notices..."
                  className="h-9 w-full pl-8 text-xs md:w-56"
                  aria-label="Search notices"
                />
              </div>

              <select
                value={audienceFilter}
                onChange={(event) => {
                  setAudienceFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by audience"
                className="h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">All audiences</option>
                {NOTICE_AUDIENCE_OPTIONS.map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>

              <select
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by category"
                className="h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">All categories</option>
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
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((row) => (
                <Skeleton
                  key={row}
                  className="h-16 w-full"
                />
              ))}
            </div>
          ) : notices.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Megaphone className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                No notices found
              </p>
              <p className="text-xs text-muted-foreground">
                {search ||
                audienceFilter ||
                categoryFilter
                  ? "Try adjusting the search or filters."
                  : "Publish your first circular to get started."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="rounded-lg border border-border p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {notice.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="info">
                          {
                            NOTICE_CATEGORY_LABELS[
                              notice.category
                            ]
                          }
                        </Badge>

                        <Badge variant="secondary">
                          {
                            NOTICE_AUDIENCE_LABELS[
                              notice.audience
                            ]
                          }
                          {notice.class
                            ? ` · ${notice.class.name}`
                            : ""}
                        </Badge>

                        {notice.expiresAt && (
                          <Badge variant="outline">
                            Expires{" "}
                            {formatDisplayDate(
                              notice.expiresAt,
                            )}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <PermissionGate permission="notices.update">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(notice)}
                          aria-label={`Edit ${notice.title}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </PermissionGate>

                      <PermissionGate permission="notices.delete">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setDeletingNotice(notice)
                          }
                          aria-label={`Delete ${notice.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </PermissionGate>
                    </div>
                  </div>

                  <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                    {notice.body}
                  </p>

                  <p className="text-[11px] text-muted-foreground">
                    Published{" "}
                    {formatDisplayDate(
                      notice.publishedAt,
                    )}
                    {notice.publishedByEmployee
                      ? ` by ${notice.publishedByEmployee.firstName} ${notice.publishedByEmployee.lastName}`
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && notices.length > 0 && (
        <div className="flex items-center justify-end gap-3">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() =>
              setPage((current) => current - 1)
            }
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Previous
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((current) => current + 1)
            }
          >
            Next
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <NoticeFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        notice={editingNotice}
        onSuccess={loadNotices}
      />

      {deletingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Delete notice
                </CardTitle>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeletingNotice(null)}
                  disabled={isDeleting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <p className="text-muted-foreground">
                This permanently removes{" "}
                <span className="font-semibold text-foreground">
                  {deletingNotice.title}
                </span>{" "}
                from the notice board. This cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeletingNotice(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
