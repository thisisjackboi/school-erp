"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DUMMY_ANNOUNCEMENTS } from "@/lib/dummy-data";
import { Megaphone, Plus, Bell } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

import { LIMITS, firstError, trimMax, validateMaxLength, validateRequired } from "@/lib/input-restrictions";

export default function AnnouncementsPage() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState(DUMMY_ANNOUNCEMENTS);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handlePost = () => {
    const error = firstError(
      validateRequired(title, "Notice title"),
      validateMaxLength(title, "Notice title", LIMITS.TITLE_MAX),
      validateMaxLength(content, "Notice content", LIMITS.REMARKS_MAX),
    );
    if (error) {
      toast("Cannot publish", error, "error");
      return;
    }
    const newAnn = {
      id: `ANN-${Math.floor(100 + Math.random() * 900)}`,
      title,
      content: content || "Details published on portal.",
      publishedDate: "2026-08-07",
      targetAudience: "All" as const,
      priority: "High" as const,
      authorName: "Principal Office",
    };
    setAnnouncements([newAnn, ...announcements]);
    toast("Announcement Broadcasted!", `Circular sent to target audience.`, "success");
    setIsOpen(false);
    setTitle("");
    setContent("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Notice Board & Circular Broadcast</h1>
          <p className="text-xs text-muted-foreground">Publish circulars, emergency alerts & notices to students, parents & teachers.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Broadcast Notice
        </Button>
      </div>

      <div className="space-y-4">
        {announcements.map((ann) => (
          <Card key={ann.id} className="hover:border-blue-500 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ann.priority === "Urgent" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
                  {ann.priority} Priority • Target: {ann.targetAudience}
                </span>
                <span className="text-xs text-slate-400">{ann.publishedDate}</span>
              </div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
                {ann.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>{ann.content}</p>
              <p className="text-[10px] text-slate-500 font-semibold pt-1">Published by: {ann.authorName}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogHeader>
          <DialogTitle>Broadcast Circular / Announcement</DialogTitle>
          <DialogDescription>Compose notice to broadcast across ERP portals.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Notice Title *</label>
            <Input placeholder="e.g. Sports Day Registration Open" maxLength={LIMITS.TITLE_MAX} value={title} onChange={(e) => setTitle(trimMax(e.target.value, LIMITS.TITLE_MAX))} />
          </div>
          <div>
            <label className="font-semibold block mb-1">Notice Content</label>
            <Input placeholder="Type detailed announcement message..." maxLength={LIMITS.REMARKS_MAX} value={content} onChange={(e) => setContent(trimMax(e.target.value, LIMITS.REMARKS_MAX))} />
          </div>
        </div>
        <DialogFooter>
          <Button size="sm" onClick={handlePost} className="bg-blue-600 hover:bg-blue-700">Publish Notice</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
