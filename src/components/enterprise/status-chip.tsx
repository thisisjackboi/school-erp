import React from "react";
import { Badge } from "@/components/ui/badge";

export function StatusChip({ status }: { status: string }) {
  let variant: "success" | "destructive" | "warning" | "info" | "secondary" | "outline" = "secondary";

  switch (status.toLowerCase()) {
    case "paid":
    case "present":
    case "active":
    case "approved":
    case "issued":
    case "checked out":
    case "completed":
    case "pass":
      variant = "success";
      break;
    case "pending":
    case "partial":
    case "processing":
    case "late":
      variant = "warning";
      break;
    case "absent":
    case "overdue":
    case "rejected":
    case "suspended":
    case "resigned":
    case "cancelled":
    case "fail":
      variant = "destructive";
      break;
    case "checked in":
    case "half day":
    case "excused":
    case "ongoing":
    case "scheduled":
      variant = "info";
      break;
    default:
      variant = "secondary";
  }

  return <Badge variant={variant}>{status}</Badge>;
}
