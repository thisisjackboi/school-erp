import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  tone: "emerald" | "amber" | "red" | "blue" | "slate";
  onClick?: () => void;
}

const TONES = {
  emerald: {
    iconBox: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    value: "text-slate-900 dark:text-slate-100",
  },
  amber: {
    iconBox: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    value: "text-amber-600 dark:text-amber-400",
  },
  red: {
    iconBox: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
    value: "text-red-600 dark:text-red-400",
  },
  blue: {
    iconBox: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    value: "text-blue-600 dark:text-blue-400",
  },
  slate: {
    iconBox: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    value: "text-slate-900 dark:text-slate-100",
  },
};

export function StatCard({ label, value, sub, icon, tone, onClick }: StatCardProps) {
  const t = TONES[tone];
  return (
    <Card className={cn(onClick && "cursor-pointer hover:shadow-md transition-shadow")} onClick={onClick}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
          <div className={cn("p-2 rounded-lg", t.iconBox)}>{icon}</div>
        </div>
        <p className={cn("mt-3 text-2xl font-bold tabular-nums", t.value)}>{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}