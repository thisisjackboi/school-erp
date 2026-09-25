import { useMemo, useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFees } from "@/lib/fees-fm/store";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { PAYMENT_MODES } from "@/lib/fees-fm/helpers";
import type { Payment } from "@/lib/fees-fm/types";

function formatDate(d?: string): string {
  if (!d) return "-";
  const dt = new Date(`${d}T00:00:00`);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function CollectFeeDialog({
  enrollmentId,
  preselectInvoiceId,
  open,
  onOpenChange,
  onSuccess,
}: {
  enrollmentId: string;
  preselectInvoiceId?: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess?: (payment: Payment) => void;
}) {
  const { invoicesForEnrollment, studentSummaries, collectPayment, paymentMethods } = useFees();
  const { toast } = useToast();
  const student = useMemo(
    () => studentSummaries.find((s) => s.enrollmentId === enrollmentId),
    [studentSummaries, enrollmentId],
  );

  const modeOptions = useMemo(() => {
    const methods = paymentMethods.length
      ? paymentMethods.map((m) => ({ value: m.name, label: m.name.replace(/_/g, " ") }))
      : PAYMENT_MODES;
    return methods;
  }, [paymentMethods]);

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

  // reset state each time dialog opens (or the preselected row changes)
  const openedKey = `${enrollmentId}:${preselectInvoiceId ?? "all"}`;
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  if (open && openedFor !== openedKey) {
    setOpenedFor(openedKey);
    const targetOutstanding = preselectInvoiceId
      ? outstanding.filter((r) => r.id === preselectInvoiceId)
      : [];
    const initialRows = targetOutstanding.length ? targetOutstanding : outstanding;
    setSelected(new Set(initialRows.map((r) => r.id)));
    const total = initialRows.reduce((s, r) => s + r.balance, 0);
    setAmount(total ? String(total) : "");
    setMode("CASH");
    setRef("");
    setRemarks("");
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

  const handleConfirm = async () => {
    setBusy(true);
    try {
      const result = await collectPayment({
        enrollmentId,
        amount: amountNum,
        paymentMode: mode,
        referenceNumber: ref || undefined,
        remarks: remarks || undefined,
        invoiceIds: Array.from(selected),
      });
      if (!result) {
        toast("Error", "No outstanding fee selected for this student.", "error");
        return;
      }
      toast("Payment recorded", `Receipt ${result.payment.receiptNumber} generated.`, "success");
      onSuccess?.(result.payment);
      onOpenChange(false);
    } catch (e) {
      toast("Payment failed", e instanceof Error ? e.message : "Could not record payment.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                {modeOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
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
            Collecting {formatCurrency(amountNum)} against {selected.size || "all"} invoice(s). The payment is added to Payment History, where you can download its receipt.
          </p>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-border mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">Cancel</Button>
          <Button onClick={handleConfirm} disabled={!canConfirm} className="bg-emerald-600 hover:bg-emerald-700 text-xs">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
            <CreditCard className="h-3.5 w-3.5 mr-1" /> Confirm Payment
          </Button>
        </div>
      </Dialog>
  );
}