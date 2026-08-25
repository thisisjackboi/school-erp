import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  icon: LucideIcon;
  iconBg?: string;
}

export function MetricCard({
  title,
  value,
  change,
  trend = "up",
  subtitle,
  icon: Icon,
  iconBg = "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
}: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          <div className={cn("p-2 rounded-lg", iconBg)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {value}
          </div>
          {change && (
            <div
              className={cn(
                "inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded",
                trend === "up"
                  ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300"
                  : trend === "down"
                  ? "text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300"
                  : "text-slate-600 bg-slate-100"
              )}
            >
              {trend === "up" && <ArrowUpRight className="mr-0.5 h-3 w-3" />}
              {trend === "down" && <ArrowDownRight className="mr-0.5 h-3 w-3" />}
              {change}
            </div>
          )}
        </div>

        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
