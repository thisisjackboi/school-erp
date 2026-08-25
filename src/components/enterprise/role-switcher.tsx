"use client";

import React, { useState } from "react";
import { useRole, ROLES } from "@/lib/permissions";
import { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShieldCheck, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function RoleSwitcher() {
  const { activeRole, setActiveRole, roleDetails } = useRole();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-border bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors text-left"
      >
        <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground leading-none">
            Active Role
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
            {roleDetails.name}
          </span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1 shrink-0" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <span>Switch User Role Context</span>
          </DialogTitle>
          <DialogDescription>
            Select any of the 14 ERP user roles to preview role-specific sidebars, permissions, dashboard widgets & page features.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1 mt-3">
          {ROLES.map((role) => {
            const isSelected = activeRole === role.id;
            return (
              <div
                key={role.id}
                onClick={() => {
                  setActiveRole(role.id as UserRole);
                  setOpen(false);
                }}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all flex items-start justify-between",
                  isSelected
                    ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-600"
                    : "border-border hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {role.name}
                    </span>
                    <span className={cn("text-[10px] px-1.5 py-0.2 rounded border font-medium", role.badgeColor)}>
                      {role.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {role.description}
                  </p>
                </div>
                {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0 ml-2 mt-0.5" />}
              </div>
            );
          })}
        </div>
      </Dialog>
    </>
  );
}
