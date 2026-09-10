import { useMemo, useState } from "react";
import {
  Loader2,
  CreditCard,
  CheckCircle2,
  Printer,
  Trash2,
} from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFees } from "@/lib/fees-fm/store";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { PAYMENT_MODES } from "@/lib/fees-fm/seed";
import { FeeStatusBadge } from "@/components/fees/fee-status-badge";
import type { Payment } from "@/lib/fees-fm/types";

function formatDate(d?: string): string {
  if (!d) return "-";
  const dt = new Date(`${d}T00:00:00`);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function CollectFeeDialog({
  enrollmentId,
  open,
  onOpenChange,
  onSuccess,
}: {
  enrollmentId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess?: (payment: Payment) => void;
}) {
  const { invoicesForEnrollment, studentSummaries, collectPayment } = useFees();
  const { toast } = useToast();
  const student = useMemo(
    () => studentSummaries.find((s) => s.enrollmentId === enrollmentId),
    [studentSummaries, enrollmentId],
  );

  const outstanding = useMemo(
    () =>
      invoicesForEnrollment(enrollmentId)
        .filter((r) => r.balance > 0)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [invoicesForEnrollment, enrollmentId],
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("CASH");
  const [ref, setRef] = useState("");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{ payment: Payment; rows: { invoiceId: string; label: string; amount: number; balanceAfter: number }[] } | null>(null);

  // reset state each time dialog opens
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  if (open && openedFor !== enrollmentId) {
    setOpenedFor(enrollmentId);
    setSelected(new Set(outstanding.map((r) => r.id)));
    setAmount(outstanding.reduce((s, r) => s + r.balance, 0) ? String(outstanding.reduce((s, r) => s + r.balance, 0)) : "");
    setMode("CASH");
    setRef("");
    setRemarks("");
    setReceipt(null);
  }

  const selectedTotal = useMemo(() => {
    if (selected.size === 0) return outstanding.reduce((s, r) => s + r.balance, 0);
    return outstanding.filter((r) => selected.has(r.id)).reduce((s, r) => s + r.balance, 0);
  }, [selected, outstanding]);

  const amountNum = Number(amount) || 0;
  const canConfirm = amountNum > 0 && amountNum <= selectedTotal + 0.001 && !busy && selected.size > 0;

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      const newTotal = outstanding.filter((r) => next.has(r.id)).reduce((s, r) => s + r.balance, 0);
      const current = Number(amount) || 0;
      if (current > newTotal) setAmount(String(newTotal));
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(outstanding.map((r) => r.id)));
    setAmount(String(outstanding.reduce((s, r) => s + r.balance, 0)));
  };

  const setFull = () => setAmount(String(selectedTotal));
  const setHalf = () => setAmount(String(Math.round(selectedTotal / 2)));

  const handleConfirm = () => {
    const result = collectPayment({
      enrollmentId,
      amount: amountNum,
      paymentMode: mode as any,
      referenceNumber: ref || undefined,
      remarks: remarks || undefined,
      invoiceIds: Array.from(selected),
    });
    if (!result) {
      toast("Error", "No outstanding fee selected for this student.", "error");
      return;
    }
    setReceipt(result);
    toast("Payment recorded", `Receipt ${result.payment.receiptNumber} generated.`, "success");
    onSuccess?.(result.payment);
  };

  const closeAll = () => {
    setReceipt(null);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <>
      <Dialog open={open && !receipt} onOpenChange={(o) => { if (!o) closeAll(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-600" /> Collect Fee
          </DialogTitle>
          <DialogDescription>
            Select the fee invoice(s) to pay. Entry amount can be lower for a partial payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3 max-h-[60vh] overflow-y-auto pr-1">
          {/* Student context */}
          {student && (
            <div className="text-xs bg-slate-50 dark:bg-slate-800/50 rounded-md p-3 space-y-1">
              <p className="font-semibold">
                {student.studentName} · {student.className}-{student.sectionName}
              </p>
              <p className="text-muted-foreground">
                Admission {student.admissionNumber} · Outstanding{" "}
                <strong className="text-amber-600">{formatCurrency(student.balance)}</strong>
              </p>
            </div>
          )}

          {/* Outstanding rows */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold">Outstanding Invoices</label>
              <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2" onClick={selectAll}>
                Select all
              </Button>
            </div>
            <div className="border rounded-md divide-y max-h-56 overflow-y-auto">
              {outstanding.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3">No outstanding fees — this student is all clear.</p>
              ) : (
                outstanding.map((r) => {
                  const checked = selected.has(r.id);
                  return (
                    <label key={r.id} className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <input type="checkbox" checked={checked} onChange={() => toggleRow(r.id)} className="accent-emerald-600" />
                      <span className="flex-1">
                        <span className="font-semibold block">{r.categoryLabel}</span>
                        <span className="text-muted-foreground text-[10px]">{r.periodLabel} · Due {formatDate(r.dueDate)}</span>
                      </span>
                      <span className="tabular-nums font-semibold">{formatCurrency(r.balance)}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold block mb-1">Amount (editable for partial) *</label>
            <Input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div className="flex gap-2 mt-1.5">
              <Button variant="outline" size="sm" className="h-6 text-[11px] px-2" onClick={setFull}>Full ({formatCurrency(selectedTotal)})</Button>
              <Button variant="outline" size="sm" className="h-6 text-[11px] px-2" onClick={setHalf}>50%</Button>
            </div>
            {amountNum > selectedTotal + 0.001 && (
              <p className="text-[11px] text-red-600 mt-1">Amount exceeds selected outstanding {formatCurrency(selectedTotal)}.</p>
            )}
          </div>

          {/* Mode + reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Payment Mode *</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                {PAYMENT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Reference No.</label>
              <Input placeholder="Optional (UPI id / cheque no)" value={ref} onChange={(e) => setRef(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Remarks</label>
            <Input placeholder="Optional note" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Collecting {formatCurrency(amountNum)} against {selected.size || "all"} invoice(s). A receipt is auto-generated and the ledger & dashboard update instantly.
          </p>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-border mt-4">
          <Button variant="outline" onClick={closeAll} className="text-xs">Cancel</Button>
          <Button onClick={handleConfirm} disabled={!canConfirm} className="bg-emerald-600 hover:bg-emerald-700 text-xs">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
            <CreditCard className="h-3.5 w-3.5 mr-1" /> Confirm Payment
          </Button>
        </div>
      </Dialog>

      {/* Receipt */}
      <Dialog open={!!receipt} onOpenChange={(o) => { if (!o) closeAll(); }}>
        {receipt && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Payment Successful
                </DialogTitle>
                <Button size="sm" onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                  <Printer className="mr-1.5 h-3.5 w-3.5" /> Print Receipt
                </Button>
              </div>
            </DialogHeader>
            <div id="printable-area" className="p-4 bg-white dark:bg-slate-900 border rounded-lg space-y-4">
              <div className="text-center border-b pb-3">
                <h2 className="text-base font-bold text-blue-900 dark:text-blue-300">PrismaEd+ School</h2>
                <p className="text-xs text-muted-foreground">Official Payment Receipt</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Student</p>
                  <p className="font-semibold">{student?.studentName || "-"}</p>
                  <p className="text-muted-foreground text-[10px]">{student?.admissionNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Receipt No</p>
                  <p className="font-mono font-semibold">{receipt.payment.receiptNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount Paid</p>
                  <p className="font-bold text-emerald-600">{formatCurrency(receipt.payment.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mode</p>
                  <p className="font-semibold">{receipt.payment.paymentMode.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-semibold">{formatDate(receipt.payment.paymentDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Received By</p>
                  <p className="font-semibold">{receipt.payment.receivedBy}</p>
                </div>
              </div>
              <div className="border rounded overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-semibold">
                    <tr>
                      <th className="p-2">Applied To</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2 text-right">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {receipt.rows.map((r, i) => (
                      <tr key={i}>
                        <td className="p-2">{r.label}</td>
                        <td className="p-2 text-right font-semibold text-emerald-600">{formatCurrency(r.amount)}</td>
                        <td className="p-2 text-right">{r.balanceAfter > 0 ? formatCurrency(r.balanceAfter) : <FeeStatusBadge status="PAID" />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {receipt.payment.referenceNumber && (
                <p className="text-[10px] text-muted-foreground">Reference: {receipt.payment.referenceNumber}</p>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={closeAll} className="text-xs">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Close
              </Button>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}