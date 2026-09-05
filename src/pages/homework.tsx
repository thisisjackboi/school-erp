"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DUMMY_HOMEWORK } from "@/lib/dummy-data";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { FileText, Plus, CheckCircle2, Download } from "lucide-react";

import { LIMITS, firstError, trimMax, validateMaxLength, validateRequired } from "@/lib/input-restrictions";

export default function HomeworkPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [homeworkList, setHomeworkList] = useState(DUMMY_HOMEWORK);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("Physics");
  const [newDesc, setNewDesc] = useState("");
  const [newDueDate, setNewDueDate] = useState("2026-08-14");

  const handleCreate = () => {
    const error = firstError(
      validateRequired(newTitle, "Homework title"),
      validateMaxLength(newTitle, "Homework title", LIMITS.TITLE_MAX),
      validateMaxLength(newDesc, "Description", LIMITS.REMARKS_MAX),
    );
    if (error) {
      toast("Cannot post", error, "error");
      return;
    }
    const newItem = {
      id: `HW-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle,
      subject: newSubject,
      grade: "Grade 10",
      section: "A",
      teacherName: "Dr. Ramesh Chandra",
      assignedDate: "2026-08-07",
      dueDate: newDueDate,
      description: newDesc || "Complete textbook exercises.",
      totalSubmissions: 0,
      totalStudents: 38,
    };
    setHomeworkList([newItem, ...homeworkList]);
    toast("Homework Posted!", `New homework task assigned to Grade 10-A.`, "success");
    setIsDialogOpen(false);
    setNewTitle("");
    setNewDesc("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Homework & Assignments</h1>
          <p className="text-xs text-muted-foreground">Post class assignments, review student submissions & track completion rates.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Assign New Homework
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {homeworkList.map((hw) => (
          <Card key={hw.id} className="hover:border-blue-500 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  {hw.subject} • {hw.grade}-{hw.section}
                </span>
                <span className="text-[10px] text-slate-400">Due: {hw.dueDate}</span>
              </div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
                {hw.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-muted-foreground line-clamp-2">{hw.description}</p>
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                <span className="text-slate-500">Submissions Rate:</span>
                <strong className="text-emerald-600 font-bold">{hw.totalSubmissions} / {hw.totalStudents} Submitted</strong>
              </div>
              {hw.attachmentName && (
                <div className="flex items-center space-x-1.5 text-blue-600 font-semibold cursor-pointer">
                  <Download className="h-3.5 w-3.5" /> <span>{hw.attachmentName}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogHeader>
          <DialogTitle>Assign Homework</DialogTitle>
          <DialogDescription>Create a new homework assignment for your class.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Homework Title *</label>
            <Input placeholder="e.g. Chapter 4 Numerical Problems" maxLength={LIMITS.TITLE_MAX} value={newTitle} onChange={(e) => setNewTitle(trimMax(e.target.value, LIMITS.TITLE_MAX))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Subject</label>
              <select value={newSubject} onChange={(e) => setNewSubject(e.target.value)} className="w-full h-9 rounded border border-input bg-background px-3 text-xs">
                <option value="Physics">Physics</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="English Literature">English Literature</option>
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Due Date</label>
              <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="font-semibold block mb-1">Instructions / Description</label>
            <Input placeholder="Detailed steps or problem numbers..." maxLength={LIMITS.REMARKS_MAX} value={newDesc} onChange={(e) => setNewDesc(trimMax(e.target.value, LIMITS.REMARKS_MAX))} />
          </div>
        </div>
        <DialogFooter>
          <Button size="sm" onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">Post Assignment</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
