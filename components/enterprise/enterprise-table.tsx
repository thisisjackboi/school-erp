"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToCSV } from "@/lib/utils";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  SlidersHorizontal,
} from "lucide-react";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface EnterpriseTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  exportFilename?: string;
  isLoading?: boolean;
  statusFilterField?: keyof T;
  statusOptions?: string[];
  actionToolbar?: React.ReactNode;
}

export function EnterpriseTable<T extends { id: string }>({
  data,
  columns,
  title,
  description,
  searchPlaceholder = "Search records...",
  exportFilename = "export_data",
  isLoading = false,
  statusFilterField,
  statusOptions,
  actionToolbar,
}: EnterpriseTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter Data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Status Filter
      if (
        statusFilterField &&
        selectedStatus !== "ALL" &&
        String(item[statusFilterField]).toLowerCase() !==
          selectedStatus.toLowerCase()
      ) {
        return false;
      }

      // Global Text Search
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return Object.values(item as Record<string, any>).some((val) =>
        String(val).toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchTerm, selectedStatus, statusFilterField]);

  // Sort Data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate Data
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage]);

  const handleSort = (key?: keyof T) => {
    if (!key) return;
    if (sortColumn === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortColumn(null);
      }
    } else {
      setSortColumn(key);
      setSortDirection("asc");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.map((item) => item.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    exportToCSV(
      exportFilename,
      filteredData.map((item) => {
        const row: Record<string, any> = {};
        columns.forEach((col) => {
          if (col.accessorKey) {
            row[col.header] = item[col.accessorKey];
          }
        });
        return row;
      })
    );
  };

  return (
    <div className="space-y-4">
      {/* Table Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {title && (
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {actionToolbar}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 px-3 text-xs"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Toolbar: Search + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>

        <div className="flex items-center space-x-2">
          {statusFilterField && statusOptions && (
            <div className="flex items-center space-x-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-slate-700 dark:text-slate-200 shadow-sm focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedIds.length > 0 && (
            <div className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded dark:bg-blue-900 dark:text-blue-200">
              {selectedIds.length} Selected
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={
                    paginatedData.length > 0 &&
                    selectedIds.length === paginatedData.length
                  }
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </TableHead>
              {columns.map((col, index) => (
                <TableHead key={index}>
                  {col.sortable && col.accessorKey ? (
                    <button
                      className="inline-flex items-center space-x-1 hover:text-slate-900 dark:hover:text-white"
                      onClick={() => handleSort(col.accessorKey)}
                    >
                      <span>{col.header}</span>
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  {columns.map((_, cIdx) => (
                    <TableCell key={cIdx}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={selectedIds.includes(row.id) ? "selected" : undefined}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleSelectItem(row.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </TableCell>
                  {columns.map((col, cIdx) => (
                    <TableCell key={cIdx}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? "-")
                        : "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-32 text-center text-muted-foreground text-sm"
                >
                  No matching records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>
          Showing {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}{" "}
          to {Math.min(currentPage * pageSize, sortedData.length)} of{" "}
          {sortedData.length} records
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
