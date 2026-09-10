import { useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  BadgePercent,
  AlertTriangle,
  Plus,
  Send,
  Receipt as ReceiptIcon,
  RotateCw,
  Bus,
  Building2,
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
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { InvoiceRow, DiscountScope } from "@/lib/fees-fm/types";

function formatDate(d?: string): string {
  if (!d) return "-";
  const dt = new Date(`${d}T00:00:00`);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function humanMode(mode: string) {
  return mode.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function FeeStudentProfilePage() {
  const { enrollmentId = "" } = useParams();
  const navigate = useNavigate();
  const {
    students, studentSummaries, invoicesForEnrollment, paymentsForEnrollment,
    discountsForEnrollment, finesForEnrollment, addOnsForEnrollment,
    structureForEnrollment, categories, attachAddOn, toggleAddOn,
    addDiscount, addFine, sendReminders,
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
  const addOns = addOnsForEnrollment(enrollmentId);
  const structure = structureForEnrollment(enrollmentId);

  // group invoices by fee head
  const grouped = useMemo(() => {
    const map = new Map<string, InvoiceRow[]>();
    for (const r of invoices) {
      const key = `${r.feeCategoryId}`;
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([key, rows]) => ({
      feeCategoryId: key,
      categoryLabel: rows[0].categoryLabel,
      source: rows[0].source,
      rows: rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      totals: {
        base: rows.reduce((s, r) => s + r.baseAmount, 0),
        discount: rows.reduce((s, r) => s + r.discountAmount, 0),
        lateFee: rows.reduce((s, r) => s + r.lateFee, 0),
        paid: rows.reduce((s, r) => s + r.paidAmount, 0),
        balance: rows.reduce((s, r) => s + r.balance, 0),
      },
    }));
  }, [invoices]);

  const [collectOpen, setCollectOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [fineOpen, setFineOpen] = useState(false);
  const [addonOpen, setAddonOpen] = useState(false);
  const fineTargetId = useRef<string | null>(null);

  const [discForm, setDiscForm] = useState({ amount: "", reason: "", scope: "ROW" as DiscountScope });
  const [fineForm, setFineForm] = useState({ amount: "", reason: "" });
  const [addonForm, setAddonForm] = useState({ feeCategoryId: "", amount: "" });

  const handleDiscount = () => {
    if (!Number(discForm.amount) || !discForm.reason.trim()) {
      toast("Error", "Amount and reason are required.", "error");
      return;
    }
    addDiscount({
      enrollmentId,
      amount: Number(discForm.amount),
      reason: discForm.reason,
      scope: discForm.scope,
    });
    toast("Discount applied", "Discount has been applied to the ledger.", "success");
    setDiscountOpen(false);
    setDiscForm({ amount: "", reason: "", scope: "ROW" });
  };

  const handleFine = (row: InvoiceRow) => {
    if (!Number(fineForm.amount) || !fineForm.reason.trim()) {
      toast("Error", "Amount and reason are required.", "error");
      return;
    }
    addFine({ enrollmentId, invoiceId: row.id, reason: fineForm.reason, amount: Number(fineForm.amount) });
    toast("Fine added", `Fine added to ${row.periodLabel}.`, "success");
    setFineOpen(false);
    setFineForm({ amount: "", reason: "" });
  };

  const handleAddon = () => {
    const cat = categories.find((c) => c.id === addonForm.feeCategoryId);
    if (!cat || !Number(addonForm.amount)) {
      toast("Error", "Select an add-on and enter its monthly amount.", "error");
      return;
    }
    attachAddOn(enrollmentId, cat.id, Number(addonForm.amount));
    toast("Add-on attached", `${cat.name} will be billed from next invoice generation.`, "success");
    setAddonOpen(false);
    setAddonForm({ feeCategoryId: "", amount: "" });
  };

  const addonLabels: Record<string, { icon: ReactNode; color: string }> = {
    "Transport Fee": { icon: <Bus className="h-3.5 w-3.5" />, color: "border-yellow-300 bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200" },
    "Hostel Fee": { icon: <Building2 className="h-3.5 w-3.5" />, color: "border-violet-300 bg-violet-50 text-violet-800 dark:bg-violet-950 dark:text-violet-200" },
    "Computer Lab Fee": { icon: <RotateCw className="h-3.5 w-3.5" />, color: "border-sky-300 bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200" },
    "Sports & Activities": { icon: <RotateCw className="h-3.5 w-3.5" />, color: "border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200" },
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
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => setCollectOpen(true)}>
              <ReceiptIcon className="mr-1.5 h-3.5 w-3.5" /> Collect Fee
            </Button>
          )}
          {canManage && (
            <>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setDiscountOpen(true)}>
                <BadgePercent className="mr-1.5 h-3.5 w-3.5" /> Add Discount
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setAddonOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Add-on
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className="text-xs" onClick={() => { const c = sendReminders([enrollmentId], "SMS"); toast("Reminder sent", `${c} reminder queued.`, "success"); }}>
            <Send className="mr-1.5 h-3.5 w-3.5" /> Remind
          </Button>
        </div>
      </div>

      {/* ID + contact */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <Card><CardContent className="p-3 space-y-1">
          <p className="text-muted-foreground">Parent / Guardian</p>
          <p className="font-semibold">{student.parentName || "-"}</p>
          <p className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {student.parentPhone || "-"}</p>
          <p className="text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {student.parentEmail || "-"}</p>
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

      {/* Assigned structure + add-ons strip */}
      <Card>
        <CardContent className="p-3 flex items-center flex-wrap gap-x-6 gap-y-2 text-xs">
          <p className="text-muted-foreground">
            Fee structure: <strong className="text-slate-700 dark:text-slate-200">{structure?.name || "Not assigned"}</strong>
            {structure && <span className="text-muted-foreground"> · {structure.items.length} head(s)</span>}
          </p>
          {addOns.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {addOns.map((a) => {
                const cat = categories.find((c) => c.id === a.feeCategoryId);
                return (
                  <label key={a.id} className={`inline-flex items-center gap-1.5 border rounded-md px-2 py-1 ${addonLabels[a.feeCategoryId]?.color || "border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
                    {addonLabels[a.feeCategoryId]?.icon}
                    <span className="font-semibold">{cat?.name || "Add-on"}</span>
                    <span className="tabular-nums">{formatCurrency(a.amount)}/mo</span>
                    <input
                      type="checkbox"
                      className="accent-blue-600"
                      checked={a.active}
                      onChange={(e) => toggleAddOn(a.id, e.target.checked)}
                      disabled={!canManage}
                    />
                  </label>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Itemized ledger per fee head */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">Fee Ledger (itemized by fee head)</CardTitle>
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
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {grouped.length === 0 ? (
                <TableRow><TableCell colSpan={canManage ? 10 : 9} className="text-center text-muted-foreground py-8">No fees assigned yet.</TableCell></TableRow>
              ) : (
                grouped.map((g) => {
                  const headPayable = g.totals.base + g.totals.lateFee - g.totals.discount;
                  const headStatus = g.rows.some((r) => r.status === "OVERDUE")
                    ? "OVERDUE"
                    : g.totals.balance <= 0 ? "PAID"
                    : g.totals.paid > 0 ? "PARTIAL" : "NONE" as const;
                  return (
                    <TableRow key={g.feeCategoryId} className="bg-slate-50 dark:bg-slate-800/40">
                      <TableCell className="text-xs font-bold">
                        {g.categoryLabel} {g.source === "ADDON" && <span className="text-blue-600 text-[10px] font-semibold">Add-on</span>}
                      </TableCell>
                      <TableCell colSpan={6} className="text-xs text-muted-foreground">
                        {g.rows.length} month(s) · head total {formatCurrency(headPayable)}
                      </TableCell>
                      <TableCell className="text-xs text-right tabular-nums font-semibold">{formatCurrency(g.totals.balance)}</TableCell>
                      <TableCell className="text-xs"><FeeStatusBadge status={headStatus} /></TableCell>
                      {canManage && <TableCell />}
                    </TableRow>
                  );
                })
                  .concat(
                    grouped.flatMap((g) =>
                      g.rows.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs pl-8">
                            <span className="text-muted-foreground">{r.categoryLabel}</span>
                            <span className="text-muted-foreground block text-[10px]">{r.periodLabel}</span>
                          </TableCell>
                          <TableCell className="text-xs">{formatDate(r.dueDate)}</TableCell>
                          <TableCell className="text-xs text-right tabular-nums">{formatCurrency(r.baseAmount)}</TableCell>
                          <TableCell className="text-xs text-right tabular-nums text-blue-600">{r.discountAmount > 0 ? `-${formatCurrency(r.discountAmount)}` : "-"}</TableCell>
                          <TableCell className="text-xs text-right tabular-nums text-red-500">{r.lateFee > 0 ? formatCurrency(r.lateFee) : "-"}</TableCell>
                          <TableCell className="text-xs text-right tabular-nums">{formatCurrency(r.payableAmount)}</TableCell>
                          <TableCell className="text-xs text-right tabular-nums text-emerald-600">{formatCurrency(r.paidAmount)}</TableCell>
                          <TableCell className="text-xs text-right tabular-nums font-semibold">{formatCurrency(r.balance)}</TableCell>
                          <TableCell className="text-xs"><FeeStatusBadge status={r.status} /></TableCell>
                          {canManage && (
                            <TableCell className="text-right">
                              <div className="inline-flex gap-1">
                                {r.balance > 0 ? (
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600" title="Add fine" onClick={() => { fineTargetId.current = r.id; setFineOpen(true); setFineForm({ amount: String(r.lateFeeAmount || 100), reason: `Late fine on ${r.periodLabel}` }); }}>
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                  </Button>
                                ) : <span className="inline-block w-6" />}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      )),
                    ),
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No payments yet.</TableCell></TableRow>
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
                  <p className="text-muted-foreground text-[10px]">{d.scope} · {d.approvedBy} · {formatDate(d.createdAt.slice(0, 10))}</p>
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
                  <span className="font-bold text-red-600">+{formatCurrency(f.amount)}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {collectOpen && (
        <CollectFeeDialog enrollmentId={enrollmentId} open={collectOpen} onOpenChange={setCollectOpen} />
      )}

      {/* Discount dialog */}
      <Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
        <DialogHeader>
          <DialogTitle>Add discount</DialogTitle>
          <DialogDescription>Merit scholarships, sibling concessions, waivers…</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold block mb-1">Scope</label>
            <select value={discForm.scope} onChange={(e) => setDiscForm({ ...discForm, scope: e.target.value as DiscountScope })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
              <option value="ROW">Single invoice (this ledger)</option>
              <option value="HEAD">Fee head (whole category)</option>
              <option value="STUDENT">Whole student ledger</option>
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
          <p className="text-[10px] text-muted-foreground">Discounts are distributed FIFO against the earliest due rows.</p>
        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t border-border mt-4">
          <Button variant="outline" onClick={() => setDiscountOpen(false)} className="text-xs">Cancel</Button>
          <Button onClick={handleDiscount} className="bg-blue-600 hover:bg-blue-700 text-xs">Apply discount</Button>
        </div>
      </Dialog>

      {/* Fine dialog */}
      <Dialog open={fineOpen} onOpenChange={setFineOpen}>
        <DialogHeader>
          <DialogTitle>Add fine</DialogTitle>
          <DialogDescription>Late fine or penalty attached to the selected invoice.</DialogDescription>
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
          <Button onClick={() => { const row = invoices.find((r) => r.id === fineTargetId.current); if (row) handleFine(row); }} className="bg-red-600 hover:bg-red-700 text-xs">Add fine</Button>
        </div>
      </Dialog>

      {/* Add-on dialog */}
      <Dialog open={addonOpen} onOpenChange={setAddonOpen}>
        <DialogHeader>
          <DialogTitle>Attach add-on</DialogTitle>
          <DialogDescription>Billing begins on the next invoice run for this student.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold block mb-1">Add-on fee head</label>
            <select value={addonForm.feeCategoryId} onChange={(e) => setAddonForm({ ...addonForm, feeCategoryId: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
              <option value="">Select…</option>
              {categories.filter((c) => c.isAddOn).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Monthly amount</label>
            <Input type="number" value={addonForm.amount} onChange={(e) => setAddonForm({ ...addonForm, amount: e.target.value })} placeholder="1500" />
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t border-border mt-4">
          <Button variant="outline" onClick={() => setAddonOpen(false)} className="text-xs">Cancel</Button>
          <Button onClick={handleAddon} className="bg-blue-600 hover:bg-blue-700 text-xs">Attach add-on</Button>
        </div>
      </Dialog>
    </div>
  );
}