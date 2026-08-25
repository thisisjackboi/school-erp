"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EventsPage() {
  const events = [
    { id: "EV-101", title: "79th Independence Day Cultural Gala", date: "Aug 15, 2026", time: "08:00 AM - 12:00 PM", venue: "Main School Ground", category: "National Event" },
    { id: "EV-102", title: "Inter-School Robotics & Coding Olympiad", date: "Aug 28, 2026", time: "09:30 AM - 03:00 PM", venue: "Tinkering Lab Annex", category: "Academic Olympiad" },
    { id: "EV-103", title: "Annual Science & Innovation Exhibition", date: "Sep 05, 2026", time: "10:00 AM - 04:00 PM", venue: "Auditorium Complex", category: "Exhibition" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">School Events Calendar</h1>
          <p className="text-xs text-muted-foreground">Schedule co-curricular events, sports meets & academic competitions.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add School Event
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {events.map((ev) => (
          <Card key={ev.id} className="hover:border-blue-500 transition-colors">
            <CardHeader className="pb-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 w-fit">
                {ev.category}
              </span>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
                {ev.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2"><Calendar className="h-3.5 w-3.5 text-blue-600" /> <span>{ev.date}</span></div>
              <div className="flex items-center space-x-2"><Clock className="h-3.5 w-3.5 text-amber-600" /> <span>{ev.time}</span></div>
              <div className="flex items-center space-x-2"><MapPin className="h-3.5 w-3.5 text-emerald-600" /> <span>{ev.venue}</span></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
