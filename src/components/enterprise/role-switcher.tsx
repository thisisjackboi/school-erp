"use client";

import React, { useState } from "react";
import { useRole } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShieldCheck, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function RoleSwitcher() {
  const { userRoles, activeRoleName } = useRole();
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
            Assigned Role
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
            {activeRoleName || "No Role"}
          </span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1 shrink-0" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <span>Assigned Roles</span>
          </DialogTitle>
          <DialogDescription>
            These are the roles assigned to your account in the database. Your
            permissions and module access come from these roles.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-2.5 max-h-[60vh] overflow-y-auto pr-1 mt-3">
          {userRoles.map((role) => {
            const isActive = activeRoleName === role.name;
            return (
              <div
                key={role.id}
                className={cn(
                  "p-3 rounded-lg border flex items-start justify-between",
                  isActive
                    ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-600"
                    : "border-border",
                )}
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {role.name}
                  </span>
                </div>
                {isActive && <Check className="h-4 w-4 text-blue-600 shrink-0 ml-2 mt-0.5" />}
              </div>
            );
          })}
          {userRoles.length === 0 && (
            <p className="text-xs text-muted-foreground">No roles assigned.</p>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </div>
      </Dialog>
    </>
  );
}