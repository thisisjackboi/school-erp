"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepItem {
  title: string;
  description: string;
}

interface StepFormProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  children: React.ReactNode;
}

export function StepForm({ steps, currentStep, onStepClick, children }: StepFormProps) {
  return (
    <div className="space-y-6">
      {/* Steps Header Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > idx;
          const isCurrent = currentStep === idx;

          return (
            <div
              key={idx}
              onClick={() => onStepClick && onStepClick(idx)}
              className={cn(
                "p-3 rounded-lg border text-left transition-all cursor-pointer relative overflow-hidden",
                isCurrent
                  ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-600"
                  : isCompleted
                  ? "border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20"
                  : "border-border bg-slate-50 dark:bg-slate-900/50 opacity-70"
              )}
            >
              <div className="flex items-center space-x-2">
                <div
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  )}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {step.title}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 truncate pl-8">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="pt-2">{children}</div>
    </div>
  );
}
