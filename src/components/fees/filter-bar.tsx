import { RotateCcw, CalendarRange } from "lucide-react";
import { useFees } from "@/lib/fees-fm/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface FilterState {
  className: string;
  setClassName: (v: string) => void;
  feeCategoryId: string;
  setFeeCategoryId: (v: string) => void;
  from: string;
  setFrom: (v: string) => void;
  to: string;
  setTo: (v: string) => void;
}

export function FilterBar({
  filters,
  showDateRange = true,
  showCategory = true,
  showClass = true,
}: {
  filters: FilterState;
  showDateRange?: boolean;
  showCategory?: boolean;
  showClass?: boolean;
}) {
  const { categories, studentSummaries } = useFees();
  const classNames = Array.from(new Set(studentSummaries.map((s) => s.className))).sort((a, b) =>
    a.localeCompare(b),
  );
  const clearable =
    filters.className || filters.feeCategoryId || filters.from || filters.to;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
      {showClass && (
        <div>
          <label className="text-xs font-semibold block mb-1">Class</label>
          <select
            value={filters.className}
            onChange={(e) => filters.setClassName(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="">All Classes</option>
            {classNames.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}
      {showCategory && (
        <div>
          <label className="text-xs font-semibold block mb-1">Fee Type / Head</label>
          <select
            value={filters.feeCategoryId}
            onChange={(e) => filters.setFeeCategoryId(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="">All Fee Types</option>
            {categories.filter((c) => c.isActive).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
      {showDateRange && (
        <>
          <div>
            <label className="text-xs font-semibold block mb-1">From</label>
            <Input type="date" value={filters.from} onChange={(e) => filters.setFrom(e.target.value)} className="h-9 text-xs" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">To</label>
            <Input type="date" value={filters.to} onChange={(e) => filters.setTo(e.target.value)} className="h-9 text-xs" />
          </div>
        </>
      )}
      <div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs w-full"
          onClick={() => {
            filters.setClassName("");
            filters.setFeeCategoryId("");
            filters.setFrom("");
            filters.setTo("");
          }}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Clear Filters
        </Button>
        {clearable && (
          <span className="flex items-center gap-1 text-[10px] text-blue-600 mt-1">
            <CalendarRange className="h-3 w-3" /> Filters active
          </span>
        )}
      </div>
    </div>
  );
}