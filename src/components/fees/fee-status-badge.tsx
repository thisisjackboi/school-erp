import { Badge } from "@/components/ui/badge";
import type { FeeStatus } from "@/lib/fees-fm/types";

const MAP: Record<string, { variant: "success" | "warning" | "destructive" | "secondary" | "outline"; label: string }> = {
  PAID: { variant: "success", label: "Paid" },
  PARTIAL: { variant: "warning", label: "Partial" },
  OVERDUE: { variant: "destructive", label: "Overdue" },
  PENDING: { variant: "secondary", label: "Pending" },
  NONE: { variant: "outline", label: "No Fees" },
};

export function FeeStatusBadge({ status, className }: { status: FeeStatus | string; className?: string }) {
  const cfg = MAP[status?.toUpperCase?.()] || MAP.NONE;
  return (
    <Badge variant={cfg.variant} className={className}>
      {cfg.label}
    </Badge>
  );
}

export function statusVariant(status: string): "success" | "warning" | "destructive" | "secondary" | "outline" {
  return MAP[status?.toUpperCase?.()]?.variant || "outline";
}

export function statusLabel(status: string): string {
  return MAP[status?.toUpperCase?.()]?.label || status || "-";
}