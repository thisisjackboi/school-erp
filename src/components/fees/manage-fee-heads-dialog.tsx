import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/components/ui/toast";
import {
  listStudentFeeHeads,
  setStudentFeeHead,
  type StudentFeeHeadRaw,
} from "@/lib/api/fees.api";
import { formatCurrency } from "@/lib/utils";

function formatDate(d?: string): string {
  if (!d) return "-";
  const dt = new Date(`${String(d).slice(0, 10)}T00:00:00`);
  if (isNaN(dt.getTime())) return String(d).slice(0, 10);
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ManageFeeHeadsDialog({
  enrollmentId,
  open,
  onOpenChange,
  onSuccess,
}: {
  enrollmentId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess: () => void;
}) {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [heads, setHeads] = useState<StudentFeeHeadRaw[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await listStudentFeeHeads(enrollmentId, accessToken);
      setHeads(res.heads ?? []);
    } catch (e) {
      toast("Could not load fee heads", e instanceof Error ? e.message : "Unknown error.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, enrollmentId, accessToken]);

  // "Applied" means the head is billed going forward. An excluded head stays
  // billed for already-settled periods, so it must be tracked by the override
  // rather than by `assigned` — that way an excluded head shows unticked and
  // can be re-included.
  const isApplied = (h: StudentFeeHeadRaw) =>
    h.assigned && h.overriddenBy !== "REMOVE";

  const handleToggle = async (h: StudentFeeHeadRaw) => {
    if (!accessToken || savingItemId || h.required) return;
    setSavingItemId(h.feeStructureItemId);
    try {
      const applied = isApplied(h);
      await setStudentFeeHead(enrollmentId, h.feeStructureItemId, applied ? "REMOVE" : "ADD", accessToken);
      toast(
        applied ? "Fee head removed" : "Fee head added",
        `${h.categoryName} ${applied ? "removed from" : "added to"} this student.`,
        "success",
      );
      onSuccess();
      await load();
    } catch (e) {
      toast(
        "Update failed",
        e instanceof Error ? e.message : "Could not update fee head.",
        "error",
      );
    } finally {
      setSavingItemId(null);
    }
  };

  const assignedCount = heads.filter((h) => isApplied(h)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Manage Fee Heads</DialogTitle>
        <DialogDescription>
          Add-on fee heads can be added or removed for this student. Required heads are always
          billed. {assignedCount} of {heads.length} heads assigned.
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-[55vh] overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          </div>
        ) : heads.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No fee structure heads are defined for this session/class yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {heads.map((h) => {
              const locked = h.required;
              const applied = isApplied(h);
              return (
                <label
                  key={h.feeStructureItemId}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                    applied ? "border-blue-300 bg-blue-50 dark:bg-blue-950/40" : "border-border"
                  } ${locked ? "opacity-80" : "cursor-pointer"}`}
                >
                  <input
                    type="checkbox"
                    checked={applied}
                    disabled={locked || !!savingItemId}
                    onChange={() => void handleToggle(h)}
                    className="accent-blue-600"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="block font-medium truncate">
                      {h.categoryName}
                      {h.required && (
                        <span className="ml-1 text-slate-500 text-[10px] font-semibold">Required</span>
                      )}
                      {h.overriddenBy === "ADD" && (
                        <span className="ml-1 text-blue-600 text-[10px] font-semibold">Add-on</span>
                      )}
                      {h.overriddenBy === "REMOVE" && (
                        <span className="ml-1 text-red-500 text-[10px] font-semibold">Excluded</span>
                      )}
                    </span>
                    <span className="text-muted-foreground text-[10px] block">
                      {h.categoryCode} · {h.isRecurring ? `recurring (${h.recurringInterval || "monthly"})` : "one-time"}
                      {h.dueDate ? ` · due ${formatDate(h.dueDate)}` : h.dueDay ? ` · due day ${h.dueDay}` : ""}
                    </span>
                  </div>
                  <span className="font-semibold text-right tabular-nums">{formatCurrency(h.amount)}</span>
                  {locked && (
                    <span className="text-[10px] text-amber-600 font-semibold whitespace-nowrap">
                      Required
                    </span>
                  )}
                  {savingItemId === h.feeStructureItemId && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
