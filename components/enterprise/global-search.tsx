"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Command, ArrowRight } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MODULE_ROUTES } from "@/lib/permissions";
import { DUMMY_STUDENTS, DUMMY_TEACHERS } from "@/lib/dummy-data";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredModules = MODULE_ROUTES.filter((m) =>
    m.title.toLowerCase().includes(query.toLowerCase())
  );

  const filteredStudents = DUMMY_STUDENTS.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTeachers = DUMMY_TEACHERS.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.department.toLowerCase().includes(query.toLowerCase())
  );

  const handleNavigate = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-border bg-slate-50 dark:bg-slate-900 text-xs text-muted-foreground hover:bg-slate-100 transition-colors w-64 justify-between"
      >
        <span className="flex items-center space-x-2">
          <Search className="h-3.5 w-3.5" />
          <span>Search modules, students...</span>
        </span>
        <kbd className="inline-flex items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search ERP modules, student names, teachers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-4 pr-1 text-xs">
            {/* Modules */}
            {filteredModules.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Navigation Modules
                </div>
                <div className="space-y-1">
                  {filteredModules.slice(0, 5).map((mod) => (
                    <div
                      key={mod.href}
                      onClick={() => handleNavigate(mod.href)}
                      className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between font-medium text-slate-800 dark:text-slate-200"
                    >
                      <span>{mod.title}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Students */}
            {filteredStudents.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Students Directory
                </div>
                <div className="space-y-1">
                  {filteredStudents.slice(0, 4).map((stu) => (
                    <div
                      key={stu.id}
                      onClick={() => handleNavigate(`/students?id=${stu.id}`)}
                      className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-slate-800 dark:text-slate-200"
                    >
                      <div>
                        <span className="font-semibold">{stu.name}</span>
                        <span className="text-muted-foreground ml-2">
                          ({stu.grade} - {stu.section})
                        </span>
                      </div>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                        {stu.admissionNo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Teachers */}
            {filteredTeachers.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Faculty & Staff
                </div>
                <div className="space-y-1">
                  {filteredTeachers.slice(0, 3).map((tch) => (
                    <div
                      key={tch.id}
                      onClick={() => handleNavigate(`/teachers?id=${tch.id}`)}
                      className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-slate-800 dark:text-slate-200"
                    >
                      <div>
                        <span className="font-semibold">{tch.name}</span>
                        <span className="text-muted-foreground ml-2">
                          • {tch.department}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {tch.designation}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}
