import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

import { PayslipDocument } from "@/components/payroll/printable-payslip";

import { getPayslip } from "@/lib/api/payroll.api";
import { useAuth } from "@/lib/auth/auth-context";

import type { PayslipResult } from "@/lib/types/payroll";

/** Standalone payslip view, so a payslip can be linked and printed directly. */
export default function PayrollPayslipPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const { accessToken } = useAuth();

  const [payslip, setPayslip] = useState<PayslipResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId || !accessToken) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const result = await getPayslip(itemId, accessToken);
        if (!cancelled) setPayslip(result);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to fetch payslip");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [itemId, accessToken]);

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/payroll/runs"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-3 w-3" />
          All payroll runs
        </Link>

        <Button
          type="button"
          onClick={() => window.print()}
          className="bg-blue-600 text-xs hover:bg-blue-700"
        >
          <Printer className="mr-1.5 h-3.5 w-3.5" />
          Print Payslip
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading payslip...
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {payslip && !isLoading && (
        <PayslipDocument item={payslip.item} run={payslip.run} />
      )}
    </div>
  );
}