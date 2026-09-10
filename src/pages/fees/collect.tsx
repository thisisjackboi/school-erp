import { useMemo, useState } from "react";
import { Search, CreditCard, UserRound, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useFees } from "@/lib/fees-fm/store";
import { useFeeAccess } from "@/lib/fees-fm/access";
import { FeeStatusBadge } from "@/components/fees/fee-status-badge";
import { CollectFeeDialog } from "@/components/fees/collect-fee-dialog";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export default function FeeCollectPage() {
  const { studentSummaries } = useFees();
  const { isParent, isReader } = useFeeAccess();
  const [query, setQuery] = useState("");
  const [collectFor, setCollectFor] = useState<string | null>(null);

  const scoped = useMemo(() => {
    if (isParent && studentSummaries.length) {
      const mineId = studentSummaries[0].enrollmentId;
      return studentSummaries.filter((s) => s.enrollmentId === mineId);
    }
    return studentSummaries;
  }, [isParent, studentSummaries]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped
      .filter((s) => s.balance > 0)
      .filter((s) => {
        if (!q) return true;
        return (
          s.studentName.toLowerCase().includes(q) ||
          s.admissionNumber.toLowerCase().includes(q) ||
          s.parentPhone.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.overdueAmount - a.overdueAmount);
  }, [scoped, query]);

  const clear = scoped.filter((s) => s.balance <= 0).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <div className="space-x-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950 dark:border-amber-900 px-2 py-1 font-semibold text-amber-700 dark:text-amber-300">
            {scoped.length - clear} pending
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-900 px-2 py-1 font-semibold text-emerald-700 dark:text-emerald-300">
            {clear} all clear
          </span>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-600" /> Collect payments
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pending student…" className="pl-8 h-9 text-xs" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Overdue</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <UserRound className="h-6 w-6 text-slate-300" />
                      {query ? "No matching students with a balance." : "Great — no student has an outstanding balance."}
                      <span className="text-xs flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> All invoices are settled.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((s) => (
                  <TableRow key={s.enrollmentId}>
                    <TableCell className="text-xs">
                      <span className="font-semibold">{s.studentName}</span>
                      <span className="text-muted-foreground block text-[10px]">{s.admissionNumber}</span>
                    </TableCell>
                    <TableCell className="text-xs">{s.className}-{s.sectionName}</TableCell>
                    <TableCell className="text-xs"><FeeStatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-xs text-right font-semibold text-red-600 tabular-nums">{formatCurrency(s.overdueAmount)}</TableCell>
                    <TableCell className="text-xs text-right font-bold tabular-nums">{formatCurrency(s.balance)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs"
                        onClick={() => setCollectFor(s.enrollmentId)}
                        disabled={isReader}
                      >
                        Collect <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="p-3 border-t text-[11px] text-muted-foreground">
            Collector creates a receipt instantly; partial payments are supported at the entry dialog.
          </div>
        </CardContent>
      </Card>

      {collectFor && (
        <CollectFeeDialog enrollmentId={collectFor} open={!!collectFor} onOpenChange={(o) => { if (!o) setCollectFor(null); }} />
      )}
    </div>
  );
}