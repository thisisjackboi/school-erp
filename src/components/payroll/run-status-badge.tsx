import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { runStatusMeta } from "@/lib/payroll-fm/helpers";
import type { PayrollRunStatus } from "@/lib/types/payroll";

interface RunStatusBadgeProps {
  status: PayrollRunStatus;
  className?: string;
}

/**
 * Payroll uses its own badge because `DRAFT` and `PROCESSED` have no generic
 * equivalent in the shared status chip.
 */
export function RunStatusBadge({ status, className }: RunStatusBadgeProps) {
  const meta = runStatusMeta(status);
  return (
    <Badge variant={meta.variant} className={cn("uppercase tracking-wide", className)}>
      {meta.label}
    </Badge>
  );
}