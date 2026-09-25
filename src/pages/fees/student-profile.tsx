import { useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  BadgePercent,
  AlertTriangle,
  Receipt as ReceiptIcon,
  Wallet,
  Settings2,
  Pencil,
  Trash2,
  Download,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { useFees } from "@/lib/fees-fm/store";
import { useFeeAccess } from "@/lib/fees-fm/access";
import { FeeStatusBadge } from "@/components/fees/fee-status-badge";
import { CollectFeeDialog } from "@/components/fees/collect-fee-dialog";
import { ManageFeeHeadsDialog } from "@/components/fees/manage-fee-heads-dialog";
import { PaymentReceiptDialog } from "@/components/fees/payment-receipt-dialog";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { InvoiceRow, FineEntry, Payment } from "@/lib/fees-fm/types";

function formatDate(d?: string): string {
  if (!d) return "-";
  const dt = new Date(`${d}T00:00:00`);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function humanMode(mode: string) {
  return mode.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function FeeSection({
  title,
  accent,
  rows,
  canManage,
  onAddFine,
  onCollect,
}: {
  title: string;
  accent: "red" | "amber" | "emerald";
  rows: InvoiceRow[];
  canManage: boolean;
  onAddFine?: (row: InvoiceRow) => void;
  onCollect?: (row: InvoiceRow) => void;
}) {
  const dot =
    accent === "red" ? "bg-red-500" : accent === "amber" ? "bg-amber-500" : "bg-emerald-500";
  const totalBalance = rows.reduce((s, r) => s + r.balance, 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          {title}
          <span className="text-[11px] font-medium text-muted-foreground">
            ({rows.length})
          </span>
          {rows.length > 0 && totalBalance > 0 && (
            <span className="ml-auto text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
              {formatCurrency(totalBalance)} due
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fee Head / Period</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Base</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Late/Fine</TableHead>
              <TableHead className="text-right">Payable</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 9 : 8}
                  className="text-center text-muted-foreground py-6 text-xs"
                >
                  No {title.toLowerCase()} fees for this enrollment.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">
                    <span className="font-semibold block">{r.categoryLabel}</span>
                    <span className="text-muted-foreground text-[10px] block">
                      {r.periodLabel}
                      {r.source === "ADDON" && (
                        <span className="ml-1 text-blue-600 font-semibold">Add-on</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(r.dueDate)}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">
                    {formatCurrency(r.baseAmount)}
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums text-blue-600">
                    {r.discountAmount > 0 ? `-${formatCurrency(r.discountAmount)}` : "-"}
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums text-red-500">
                    {r.lateFee > 0 || r.fineAmount > 0
                      ? formatCurrency(r.lateFee + r.fineAmount)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums">
                    {formatCurrency(r.payableAmount)}
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums text-emerald-600">
                    {formatCurrency(r.paidAmount)}
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums font-semibold">
                    {formatCurrency(r.balance)}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        {r.balance > 0 ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-emerald-600"
                              title="Collect this row"
                              onClick={() => onCollect?.(r)}
                            >
                              <Wallet className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-emerald-600"
                              title="Add fine"
                              onClick={() => onAddFine?.(r)}
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <span className="inline-block w-6" />
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function FeeStudentProfilePage() {
  const { enrollmentId = "" } = useParams();
  const navigate = useNavigate();
  const {
    students, studentSummaries, invoicesForEnrollment, paymentsForEnrollment,
    discountsForEnrollment, finesForEnrollment,
    structureForEnrollment, addDiscount, addFine, updateFine, deleteFine, reload,
  } = useFees();
  const { isParent, canManage, canCollect } = useFeeAccess();
  const { toast } = useToast();

  const student = useMemo(() => students.find((s) => s.enrollmentId === enrollmentId), [students, enrollmentId]);
  const summary = useMemo(() => studentSummaries.find((s) => s.enrollmentId === enrollmentId), [studentSummaries, enrollmentId]);

  // parent scope: only their child
  if (isParent && studentSummaries.length && enrollmentId !== studentSummaries[0].enrollmentId) {
    return (
      <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
        You can only view your own child&apos;s fee ledger.
      </CardContent></Card>
    );
  }

  if (!student) {
    return (
      <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
        Student not found. <Link to="/fees/students" className="text-blue-600">Back to Students</Link>
      </CardContent></Card>
    );
  }

  const invoices = invoicesForEnrollment(enrollmentId);
  const payments = paymentsForEnrollment(enrollmentId);
  const discounts = discountsForEnrollment(enrollmentId);
  const fines = finesForEnrollment(enrollmentId);
  const structure = structureForEnrollment(enrollmentId);

  // Fee ledger split by payment status
  const overdueRows = useMemo(
    () =>
      invoices
        .filter((r) => r.status === "OVERDUE")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [invoices],
  );
  const pendingRows = useMemo(
    () =>
      invoices
        .filter((r) => r.balance > 0 && r.status !== "OVERDUE")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [invoices],
  );
  const paidRows = useMemo(
    () =>
      invoices
        .filter((r) => r.balance <= 0)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [invoices],
  );

  const [collectOpen, setCollectOpen] = useState(false);
  const [collectRowId, setCollectRowId] = useState<string | null>(null);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [fineOpen, setFineOpen] = useState(false);
  const [manageHeadsOpen, setManageHeadsOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const fineTargetId = useRef<string | null>(null);
  const [editingFine, setEditingFine] = useState<FineEntry | null>(null);

  const [discForm, setDiscForm] = useState({ invoiceId: "", amount: "", reason: "" });
  const [fineForm, setFineForm] = useState({ amount: "", reason: "" });

  const discountOptions = invoices.filter((r) => r.balance > 0);

  const handleDiscount = async () => {
    if (!discForm.invoiceId || !Number(discForm.amount) || !discForm.reason.trim()) {
      toast("Error", "Choose an invoice, amount and reason.", "error");
      return;
    }
    const target = invoices.find((r) => r.id === discForm.invoiceId);
    if (!target) {
      toast("Error", "Could not resolve that invoice.", "error");
      return;
    }
    try {
      await addDiscount({
        assignmentId: target.assignmentId,
        ...(target.feeStructureItemId && { feeStructureItemId: target.feeStructureItemId }),
        amount: Number(discForm.amount),
        reason: discForm.reason,
      });
      toast("Discount applied", `Applied to ${target.categoryLabel} · ${target.periodLabel}.`, "success");
      setDiscountOpen(false);
      setDiscForm({ invoiceId: "", amount: "", reason: "" });
    } catch (e) {
      toast("Failed", e instanceof Error ? e.message : "Could not apply discount.", "error");
    }
  };

  const handleFine = async (row: InvoiceRow) => {
    if (!Number(fineForm.amount) || !fineForm.reason.trim()) {
      toast("Error", "Amount and reason are required.", "error");
      return;
    }
    try {
      if (editingFine) {
        await updateFine({
          id: editingFine.id,
          amount: Number(fineForm.amount),
          reason: fineForm.reason,
        });
        toast("Fine updated", `Updated on ${row.periodLabel}.`, "success");
      } else {
        await addFine({
          assignmentId: row.assignmentId,
          feeStructureItemId: row.feeStructureItemId,
          reason: fineForm.reason,
          amount: Number(fineForm.amount),
        });
        toast("Fine added", `Fine added to ${row.categoryLabel} · ${row.periodLabel}.`, "success");
      }
      setFineOpen(false);
      setEditingFine(null);
      setFineForm({ amount: "", reason: "" });
    } catch (e) {
      toast("Failed", e instanceof Error ? e.message : "Could not save fine.", "error");
    }
  };

  const handleDeleteFine = async (f: FineEntry) => {
    if (!window.confirm(`Delete fine of ${formatCurrency(f.amount)}? This cannot be undone.`)) return;
    try {
      await deleteFine(f.id);
      toast("Fine deleted", "Fine removed and totals updated.", "success");
    } catch (e) {
      toast("Failed", e instanceof Error ? e.message : "Could not delete fine.", "error");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap p-4 rounded-xl border bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <button onClick={() => navigate("/fees/students")} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Avatar fallback={`${student.firstName[0]}${student.lastName[0] || ""}`} size="md" />
          <div>
            <h2 className="font-bold text-base leading-tight">{student.firstName} {student.lastName}</h2>
            <p className="text-xs text-muted-foreground">
              {student.className}-{student.sectionName} · Roll {student.rollNumber || "-"} · {student.admissionNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canCollect && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => { setCollectRowId(null); setCollectOpen(true); }}>
              <ReceiptIcon className="mr-1.5 h-3.5 w-3.5" /> Collect Fee
            </Button>
          )}
          {canManage && (
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setDiscountOpen(true)}>
              <BadgePercent className="mr-1.5 h-3.5 w-3.5" /> Add Discount
            </Button>
          )}
          {canManage && (
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setManageHeadsOpen(true)}>
              <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Manage Fee Heads
            </Button>
          )}
        </div>
      </div>

      {/* ID + contact */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <Card><CardContent className="p-3 space-y-1">
          <p className="text-muted-foreground">Parent / Guardian</p>
          <p className="font-semibold">{summary?.parentName || student.parentName || "-"}</p>
          <p className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {summary?.parentPhone || student.parentPhone || "-"}</p>
          <p className="text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {summary?.parentEmail || student.parentEmail || "-"}</p>
        </CardContent></Card>
        {summary && (
          <>
            <Card><CardContent className="p-3 space-y-1">
              <p className="text-muted-foreground">Status</p>
              <FeeStatusBadge status={summary.status} />
              <p className="text-muted-foreground text-[10px]">{summary.overdueCount > 0 ? `${summary.overdueCount} overdue invoice(s)` : "No overdue invoices"}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 space-y-1">
              <p className="text-muted-foreground">Paid / Balance</p>
              <p className="font-semibold text-emerald-600">{formatCurrency(summary.paid)}</p>
              <p className="text-muted-foreground">Balance <strong>{formatCurrency(summary.balance)}</strong></p>
            </CardContent></Card>
            <Card><CardContent className="p-3 space-y-1">
              <p className="text-muted-foreground">Discounts & Fines</p>
              <p className="font-semibold text-blue-600">Discount {formatCurrency(summary.discountTotal)}</p>
              <p className="text-red-600">Fines {formatCurrency(summary.fineTotal)}</p>
            </CardContent></Card>
          </>
        )}
      </div>

      {/* Assigned structure strip */}
      <Card>
        <CardContent className="p-3 flex items-center flex-wrap gap-x-6 gap-y-2 text-xs">
          <p className="text-muted-foreground">
            Fee structure: <strong className="text-slate-700 dark:text-slate-200">{structure?.name || "Not assigned"}</strong>
            {structure && <span className="text-muted-foreground"> · {structure.items.length} head(s)</span>}
          </p>
        </CardContent>
      </Card>

      {/* Fee ledger, one section per status */}
      <FeeSection
        title="Overdue"
        accent="red"
        rows={overdueRows}
        canManage={canManage}
        onAddFine={(r) => {
          fineTargetId.current = r.id;
          setEditingFine(null);
          setFineOpen(true);
          setFineForm({
            amount: "",
            reason: `Late fine on ${r.periodLabel}`,
          });
        }}
        onCollect={(r) => {
          setCollectRowId(r.id);
          setCollectOpen(true);
        }}
      />

      <FeeSection
        title="Pending"
        accent="amber"
        rows={pendingRows}
        canManage={canManage}
        onAddFine={(r) => {
          fineTargetId.current = r.id;
          setEditingFine(null);
          setFineOpen(true);
          setFineForm({
            amount: "",
            reason: `Late fine on ${r.periodLabel}`,
          });
        }}
        onCollect={(r) => {
          setCollectRowId(r.id);
          setCollectOpen(true);
        }}
      />

      <FeeSection
        title="Paid"
        accent="emerald"
        rows={paidRows}
        canManage={canManage}
      />

      {/* Payments & receipts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">Payment History & Receipts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt No</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Received By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Applied To</TableHead>
                <TableHead className="text-right">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No payments yet.</TableCell></TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs font-mono font-semibold">{p.receiptNumber}</TableCell>
                    <TableCell className="text-xs text-right font-semibold text-emerald-600 tabular-nums">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="text-xs">{humanMode(p.paymentMode)}</TableCell>
                    <TableCell className="text-xs">{p.receivedBy}</TableCell>
                    <TableCell className="text-xs">{formatDate(p.paymentDate)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.allocations.map((a, i) => {
                        const inv = invoices.find((r) => r.id === a.invoiceId);
                        return <span key={i} className="block">{inv ? `${inv.categoryLabel} · ${inv.periodLabel}` : a.invoiceId}: {formatCurrency(a.amount)}</span>;
                      })}
                      {p.referenceNumber && <span className="block text-[10px]">Ref: {p.referenceNumber}</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => setReceiptPayment(p)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md px-2 py-1 border border-emerald-200 dark:border-emerald-900"
                        title="Download receipt"
                      >
                        <Download className="h-3 w-3" /> Receipt
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Discounts & fines summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-blue-700 dark:text-blue-300">Discounts ({discounts.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {discounts.length === 0 && <p className="text-xs text-muted-foreground">No discounts applied.</p>}
            {discounts.map((d) => (
              <div key={d.id} className="flex items-center justify-between text-xs border rounded-md px-3 py-2">
                <div>
                  <p className="font-semibold">{d.reason}</p>
                  <p className="text-muted-foreground text-[10px]">{d.periodLabel || "Student"} · {d.approvedBy} · {formatDate(d.createdAt.slice(0, 10))}</p>
                </div>
                <span className="font-bold text-blue-600">-{formatCurrency(d.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-red-700 dark:text-red-300">Fines ({fines.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {fines.length === 0 && <p className="text-xs text-muted-foreground">No fines recorded.</p>}
            {fines.map((f) => {
              const inv = invoices.find((r) => r.id === f.invoiceId);
              return (
                <div key={f.id} className="flex items-center justify-between text-xs border rounded-md px-3 py-2">
                  <div>
                    <p className="font-semibold">{f.reason}</p>
                    <p className="text-muted-foreground text-[10px]">{inv ? `${inv.categoryLabel} · ${inv.periodLabel}` : f.invoiceId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-600">+{formatCurrency(f.amount)}</span>
                    {canManage && (
                      <div className="inline-flex gap-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFine(f);
                            setFineOpen(true);
                            setFineForm({ amount: String(f.amount), reason: f.reason });
                          }}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                          title="Edit fine"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteFine(f)}
                          className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500"
                          title="Delete fine"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {collectOpen && (
        <CollectFeeDialog
          enrollmentId={enrollmentId}
          preselectInvoiceId={collectRowId}
          open={collectOpen}
          onOpenChange={(o) => { setCollectOpen(o); if (!o) setCollectRowId(null); }}
        />
      )}

      <PaymentReceiptDialog
        payment={receiptPayment}
        student={student}
        invoices={invoices}
        onClose={() => setReceiptPayment(null)}
      />

      {manageHeadsOpen && (
        <ManageFeeHeadsDialog
          enrollmentId={enrollmentId}
          open={manageHeadsOpen}
          onOpenChange={setManageHeadsOpen}
          onSuccess={() => void reload()}
        />
      )}

      {/* Discount dialog */}
      <Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
        <DialogHeader>
          <DialogTitle>Add discount</DialogTitle>
          <DialogDescription>Merit scholarships, sibling concessions, waivers… Applied to the selected fee head of that period.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold block mb-1">Invoice / Period *</label>
            <select value={discForm.invoiceId} onChange={(e) => setDiscForm({ ...discForm, invoiceId: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
              <option value="">Select an outstanding invoice…</option>
              {discountOptions.map((r) => (
                <option key={r.id} value={r.id} disabled={r.balance <= 0}>{r.categoryLabel} · {r.periodLabel} · {formatCurrency(r.balance)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Amount</label>
              <Input type="number" value={discForm.amount} onChange={(e) => setDiscForm({ ...discForm, amount: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Reason</label>
              <Input value={discForm.reason} onChange={(e) => setDiscForm({ ...discForm, reason: e.target.value })} placeholder="e.g. Merit 25%" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">The discount applies to the selected fee head for that period and reduces its payable by the entered amount.</p>
        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t border-border mt-4">
          <Button variant="outline" onClick={() => setDiscountOpen(false)} className="text-xs">Cancel</Button>
          <Button onClick={handleDiscount} className="bg-blue-600 hover:bg-blue-700 text-xs">Apply discount</Button>
        </div>
      </Dialog>

      {/* Fine dialog */}
      <Dialog open={fineOpen} onOpenChange={(o) => { setFineOpen(o); if (!o) setEditingFine(null); }}>
        <DialogHeader>
          <DialogTitle>{editingFine ? "Edit fine" : "Add fine"}</DialogTitle>
          <DialogDescription>
            {editingFine
              ? "Change the amount or reason. Totals update automatically."
              : "Late fine or penalty attached to the selected invoice."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <label className="text-xs font-semibold block mb-1">Amount</label>
            <Input type="number" value={fineForm.amount} onChange={(e) => setFineForm({ ...fineForm, amount: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Reason</label>
            <Input value={fineForm.reason} onChange={(e) => setFineForm({ ...fineForm, reason: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t border-border mt-4">
          <Button variant="outline" onClick={() => setFineOpen(false)} className="text-xs">Cancel</Button>
          <Button onClick={() => { const row = invoices.find((r) => r.id === (editingFine ? editingFine.invoiceId : fineTargetId.current)); if (row) handleFine(row); }} className="bg-red-600 hover:bg-red-700 text-xs">{editingFine ? "Save changes" : "Add fine"}</Button>
        </div>
      </Dialog>

      </div>
  );
}