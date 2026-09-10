import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  UserRound,
  Send,
  Download,
  Printer,
  UserCheck,
  Bell,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useFees, useFeeFiltersState } from "@/lib/fees-fm/store";
import { useFeeAccess } from "@/lib/fees-fm/access";
import { FeeStatusBadge } from "@/components/fees/fee-status-badge";
import { CollectFeeDialog } from "@/components/fees/collect-fee-dialog";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { StudentSummaryRow } from "@/lib/fees-fm/types";

function formatDate(d?: string): string {
  if (!d) return "-";
  const dt = new Date(`${d}T00:00:00`);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function exportCsv(rows: StudentSummaryRow[]) {
  const header = ["Admission", "Student", "Class", "Section", "Status", "Total Due", "Paid", "Balance", "Overdue", "Last Paid"];
  const lines = rows.map((r) => [
    r.admissionNumber,
    r.studentName,
    r.className,
    r.sectionName,
    r.status,
    r.totalDue,
    r.paid,
    r.balance,
    r.overdueAmount,
    r.lastPaymentDate || "",
  ]);
  const csv = [header, ...lines].map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `student-fees-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FeeStudentsPage() {
  const { studentSummaries, sendReminders } = useFees();
  const { isParent, isReader, canCollect } = useFeeAccess();
  const { toast } = useToast();
  const filters = useFeeFiltersState();
  const [query, setQuery] = useState("");
  const [collectFor, setCollectFor] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const scoped = useMemo(() => {
    if (isParent && studentSummaries.length) {
      const mine = studentSummaries[0].enrollmentId;
      return studentSummaries.filter((s) => s.enrollmentId === mine);
    }
    return studentSummaries;
  }, [isParent, studentSummaries]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped.filter((s) => {
      if (filters.className && s.className !== filters.className) return false;
      if (!q) return true;
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q) ||
        s.parentPhone.toLowerCase().includes(q) ||
        (s.rollNumber ? String(s.rollNumber).includes(q) : false)
      );
    });
  }, [scoped, filters.className, query]);

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.enrollmentId)));
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRemind = () => {
    const ids = selected.size ? Array.from(selected) : rows.filter((r) => r.overdueAmount > 0).map((r) => r.enrollmentId);
    const count = sendReminders(ids, "SMS");
    toast("Reminders sent", `${count} student reminder(s) queued via SMS.`, "success");
  };

  const handlePrint = () => window.print();

  const totals = useMemo(
    () => ({
      due: scoped.reduce((s, r) => s + r.totalDue, 0),
      paid: scoped.reduce((s, r) => s + r.paid, 0),
      balance: scoped.reduce((s, r) => s + r.balance, 0),
      overdue: scoped.filter((r) => r.status === "OVERDUE").length,
    }),
    [scoped],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
          <p className="text-xs text-muted-foreground">Students shown</p>
          <p className="text-xl font-bold">{scoped.length}</p>
        </div>
        <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3">
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Total due</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totals.due)}</p>
        </div>
        <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/50 px-4 py-3">
          <p className="text-xs text-amber-700 dark:text-amber-300">Net balance</p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(totals.balance)}</p>
        </div>
        <div className="rounded-lg border bg-red-50 dark:bg-red-950/50 px-4 py-3">
          <p className="text-xs text-red-700 dark:text-red-300">Overdue students</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-300">{totals.overdue}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, admission no, phone or roll…"
                className="pl-8 h-9 text-xs"
              />
            </div>
            <select
              value={filters.className}
              onChange={(e) => filters.setClassName(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">All Classes</option>
              {Array.from(new Set(scoped.map((s) => s.className))).sort((a, b) => a.localeCompare(b)).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handleRemind} disabled={isReader}>
              <Send className="mr-1.5 h-3.5 w-3.5" /> Send Reminders{selected.size ? ` (${selected.size})` : ""}
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => exportCsv(rows)}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handlePrint}>
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <input type="checkbox" className="accent-blue-600" checked={rows.length > 0 && selected.size === rows.length} onChange={toggleAll} />
                </TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Due</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Last Paid</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                  <UserRound className="h-6 w-6 mx-auto text-slate-300 mb-2" />
                  No students in this view.
                </TableCell></TableRow>
              ) : (
                rows.map((s) => (
                  <TableRow key={s.enrollmentId}>
                    <TableCell>
                      <input type="checkbox" className="accent-blue-600" checked={selected.has(s.enrollmentId)} onChange={() => toggleOne(s.enrollmentId)} />
                    </TableCell>
                    <TableCell className="text-xs">
                      <Link to={`/fees/students/${s.enrollmentId}`} className="font-semibold hover:text-blue-600">
                        {s.studentName}
                      </Link>
                      <span className="text-muted-foreground block text-[10px]">{s.admissionNumber}{s.rollNumber ? ` · Roll ${s.rollNumber}` : ""}</span>
                    </TableCell>
                    <TableCell className="text-xs">{s.className}-{s.sectionName}</TableCell>
                    <TableCell className="text-xs"><FeeStatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{formatCurrency(s.totalDue)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-emerald-600">{formatCurrency(s.paid)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums font-semibold">{formatCurrency(s.balance)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(s.lastPaymentDate)}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Link to={`/fees/students/${s.enrollmentId}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><UserCheck className="h-3.5 w-3.5" /></Button>
                        </Link>
                        {canCollect && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={() => setCollectFor(s.enrollmentId)}>
                            <Bell className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <p className="text-[11px] text-muted-foreground">
            {selected.size > 0 ? `${selected.size} selected · ` : ""}{rows.length} of {scoped.length} students · bulk actions act on selected or overdue students.
          </p>
        </CardContent>
      </Card>

      {collectFor && (
        <CollectFeeDialog enrollmentId={collectFor} open={!!collectFor} onOpenChange={(o) => { if (!o) setCollectFor(null); }} />
      )}
    </div>
  );
}