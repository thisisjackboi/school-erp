import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({
  value = 0,
  max = 100,
  className,
  color = "bg-primary",
}: {
  value?: number;
  max?: number;
  className?: string;
  color?: string;
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800", className)}>
      <div
        className={cn("h-full transition-all duration-300 ease-in-out", color)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
