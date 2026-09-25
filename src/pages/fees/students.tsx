import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  UserRound,
  Download,
  Printer,
  UserCheck,
  Bell,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useFees } from "@/lib/fees-fm/store";
import { useFeeAccess } from "@/lib/fees-fm/access";
import { useAuth } from "@/lib/auth/auth-context";
import { listStudentSummaries } from "@/lib/api/fees.api";
import { FeeStatusBadge } from "@/components/fees/fee-status-badge";
import { CollectFeeDialog } from "@/components/fees/collect-fee-dialog";
import { formatCurrency } from "@/lib/utils";
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
  const { accessToken } = useAuth();
  const { sessions, session, reloading } = useFees();
  const { isParent, canCollect } = useFeeAccess();
  const [query, setQuery] = useState("");
  const [collectFor, setCollectFor] = useState<string | null>(null);

  // Filter section: academic year, class, section
  const [yearId, setYearId] = useState<string>(session?.id ?? "");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [summaries, setSummaries] = useState<StudentSummaryRow[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    if (!yearId && session?.id) setYearId(session.id);
  }, [session?.id, yearId]);

  const effectiveYearId = yearId || session?.id || "";

  useEffect(() => {
    if (reloading) return;
    if (!effectiveYearId || !accessToken) {
      setSummaries([]);
      return;
    }
    let cancelled = false;
    setFilterLoading(true);
    listStudentSummaries({ academicSessionId: effectiveYearId }, accessToken)
      .then((rows) => {
        if (!cancelled) setSummaries(rows as StudentSummaryRow[]);
      })
      .catch(() => {
        if (!cancelled) setSummaries([]);
      })
      .finally(() => {
        if (!cancelled) setFilterLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveYearId, accessToken, reloading]);

  const handleYearChange = (value: string) => {
    setYearId(value);
    setSelectedClass("");
    setSelectedSection("");
  };

  const classOptions = useMemo(
    () =>
      Array.from(new Set(summaries.map((s) => s.className))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [summaries],
  );

  const sectionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          summaries
            .filter((s) => !selectedClass || s.className === selectedClass)
            .map((s) => s.sectionName),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [summaries, selectedClass],
  );

  const scoped = useMemo(() => {
    let list = summaries;
    if (isParent && list.length) {
      const mine = list[0].enrollmentId;
      list = list.filter((s) => s.enrollmentId === mine);
    }
    return list.filter((s) => {
      if (selectedClass && s.className !== selectedClass) return false;
      if (selectedSection && s.sectionName !== selectedSection) return false;
      return true;
    });
  }, [summaries, isParent, selectedClass, selectedSection]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q) ||
        s.parentPhone.toLowerCase().includes(q) ||
        (s.rollNumber ? String(s.rollNumber).includes(q) : false),
    );
  }, [scoped, query]);

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
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={yearId}
              onChange={(e) => handleYearChange(e.target.value)}
              disabled={sessions.length === 0}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold"
              aria-label="Academic Year"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </select>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection("");
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold"
              aria-label="Class"
            >
              <option value="">All Classes</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold"
              aria-label="Section"
            >
              <option value="">All Sections</option>
              {sectionOptions.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
            {filterLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            )}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, admission no, phone or roll…"
                className="pl-8 h-9 text-xs"
              />
            </div>
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
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  <UserRound className="h-6 w-6 mx-auto text-slate-300 mb-2" />
                  No students in this view.
                </TableCell></TableRow>
              ) : (
                rows.map((s) => (
                  <TableRow key={s.enrollmentId}>
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
            {rows.length} of {scoped.length} students · click a student to view the full ledger.
          </p>
        </CardContent>
      </Card>

      {collectFor && (
        <CollectFeeDialog enrollmentId={collectFor} open={!!collectFor} onOpenChange={(o) => { if (!o) setCollectFor(null); }} />
      )}
    </div>
  );
}