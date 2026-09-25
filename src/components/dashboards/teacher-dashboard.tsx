"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { MetricCard } from "@/components/enterprise/metric-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import { getDashboard } from "@/lib/api/dashboard.api";
import { formatTimeOfDay, formatDisplayDate } from "@/lib/dates";
import type {
  TeacherDashboard,
  DashboardDay,
  DashboardSlot,
} from "@/lib/types/dashboard";
import {
  Clock,
  Calendar,
  BookOpen,
  GraduationCap,
  UserCheck,
  Newspaper,
  MapPin,
} from "lucide-react";

function formatTime(dateStr: string) {
  return formatTimeOfDay(dateStr);
}

function SlotRow({ slot }: { slot: DashboardSlot }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40">
      <div className="flex items-center space-x-3 min-w-0">
        <span className="shrink-0 w-12 text-center font-bold text-blue-600 text-sm">
          {slot.periodName}
        </span>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
            {slot.subjectName}
            <span className="text-muted-foreground font-normal">
              {" "}
              • {slot.className} - {slot.sectionName}
            </span>
          </p>
          <p className="text-muted-foreground">
            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
            {slot.room && (
              <>
                {" "}
                • <MapPin className="inline h-3 w-3 text-muted-foreground" />{" "}
                {slot.room}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function DayScheduleCard({ day }: { day: DashboardDay }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            {day.isToday ? (
              <Calendar className="h-4 w-4 text-blue-600" />
            ) : (
              <Clock className="h-4 w-4 text-slate-400" />
            )}
            {day.dayName}
          </span>
          <div className="flex items-center gap-2">
            {day.isToday && <Badge variant="info">Today</Badge>}
            <span className="text-xs text-muted-foreground font-normal">
              {formatDisplayDate(day.date)}
            </span>
            <Badge variant={day.slots.length > 0 ? "success" : "secondary"}>
              {day.slots.length} class{day.slots.length !== 1 ? "es" : ""}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {day.slots.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">
            No classes scheduled for {day.isToday ? "today" : "this day"}.
          </p>
        ) : (
          day.slots.map((slot) => <SlotRow key={slot.slotId} slot={slot} />)
        )}
      </CardContent>
    </Card>
  );
}

export function TeacherDashboard() {
  const { accessToken, user } = useAuth();

  const [dashboard, setDashboard] = useState<TeacherDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUpcomingDay, setSelectedUpcomingDay] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!accessToken || !user) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getDashboard(accessToken);
        if (cancelled) return;

        setDashboard(data);

        const firstClassDay =
          data.upcoming.find((day) => day.slots.length > 0) ??
          data.upcoming[0];
        if (firstClassDay) {
          setSelectedUpcomingDay(firstClassDay.date);
        }
      } catch {
        if (!cancelled) setDashboard(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, user]);

  const subjects = dashboard?.subjects ?? [];
  const upcoming = dashboard?.upcoming ?? [];
  const todaySlots = dashboard?.today.slots ?? [];
  const selectedDay =
    upcoming.find((d) => d.date === selectedUpcomingDay) ?? upcoming[0];

  const uniqueSubjects = useMemo(() => {
    const found = new Set<string>();
    subjects.forEach((cls) =>
      cls.sections.forEach((sec) =>
        sec.subjects.forEach((s) => found.add(s.name)),
      ),
    );
    return found.size;
  }, [subjects]);

  const totalSections = useMemo(() => {
    return subjects.reduce((acc, cls) => acc + cls.sections.length, 0);
  }, [subjects]);

  const totalUpcomingClasses = useMemo(() => {
    return upcoming.reduce((acc, day) => acc + day.slots.length, 0);
  }, [upcoming]);

  const nextClassToday = todaySlots[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Classes"
          value={
            loading ? "..." : `${todaySlots.length} Period${todaySlots.length !== 1 ? "s" : ""}`
          }
          change={dashboard?.today.dayName ?? ""}
          trend="neutral"
          subtitle={
            nextClassToday
              ? `Next: ${nextClassToday.subjectName} • ${nextClassToday.className}-${nextClassToday.sectionName}`
              : "No classes scheduled"
          }
          icon={Clock}
          iconBg="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
        />
        <MetricCard
          title="Subjects Teaching"
          value={loading ? "..." : `${uniqueSubjects}`}
          change={`${subjects.length} class${subjects.length !== 1 ? "es" : ""}`}
          trend="neutral"
          subtitle={`Across ${totalSections} section${totalSections !== 1 ? "s" : ""}`}
          icon={BookOpen}
          iconBg="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
        />
        <MetricCard
          title="Week Workload"
          value={loading ? "..." : `${totalUpcomingClasses} Class${totalUpcomingClasses !== 1 ? "es" : ""}`}
          change={`${upcoming.length} upcoming day${upcoming.length !== 1 ? "s" : ""}`}
          trend="neutral"
          subtitle="Classes in next 7 days"
          icon={GraduationCap}
          iconBg="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
        />
        <MetricCard
          title="Academic Session"
          value={dashboard?.currentSession?.name ?? "—"}
          change={dashboard?.profile.employeeCode ?? ""}
          trend="neutral"
          subtitle={
            dashboard?.currentSession
              ? `${formatDisplayDate(dashboard.currentSession.startDate)} - ${formatDisplayDate(dashboard.currentSession.endDate)}`
              : "No active session"
          }
          icon={Calendar}
          iconBg="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Subjects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>My Subjects</span>
              <span className="text-xs text-muted-foreground font-normal">
                Per class & section
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {loading ? (
              <p className="text-muted-foreground text-center py-6">
                Loading subjects...
              </p>
            ) : subjects.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                No subjects assigned yet.
              </p>
            ) : (
              subjects.map((cls) => (
                <div key={cls.classId}>
                  <p className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {cls.className}
                  </p>
                  <div className="space-y-2">
                    {cls.sections.map((sec) => (
                      <div
                        key={sec.sectionId}
                        className="p-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">
                            Section {sec.sectionName}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {sec.subjects.map((s) => (
                            <Badge key={s.assignmentId} variant="success">
                              {s.name} ({s.code})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        {loading ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              <p className="text-muted-foreground text-center py-6">
                Loading schedule...
              </p>
            </CardContent>
          </Card>
        ) : dashboard?.today ? (
          <DayScheduleCard day={dashboard.today} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              <p className="text-muted-foreground text-center py-6">
                No schedule available.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming Days Timetable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Upcoming Days Timetable
            </span>
            <Link to="/timetable">
              <Button variant="outline" size="sm" className="h-7 text-xs">
                View Full Timetable
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground text-center py-6 text-xs">
              Loading upcoming timetable...
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {upcoming.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedUpcomingDay(day.date)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                      selectedDay?.date === day.date
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-border bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="block">{day.dayName.slice(0, 3)}</span>
                    <span className="block opacity-80">
                      {day.slots.length > 0
                        ? `${day.slots.length} class${day.slots.length !== 1 ? "es" : ""}`
                        : "Free"}
                    </span>
                  </button>
                ))}
              </div>

              {selectedDay ? (
                <DayScheduleCard key={selectedDay.date} day={selectedDay} />
              ) : (
                <p className="text-muted-foreground text-center py-6 text-xs">
                  No upcoming days available.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Recent Notices</span>
              <Newspaper className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {loading ? (
              <p className="text-muted-foreground text-center py-6">
                Loading notices...
              </p>
            ) : (dashboard?.notices ?? []).length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                No notices published yet.
              </p>
            ) : (
              (dashboard?.notices ?? []).map((notice) => (
                <div
                  key={notice.id}
                  className="p-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40"
                >
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    {notice.title}
                  </p>
                  <p className="text-muted-foreground mt-1 line-clamp-2">
                    {notice.body}
                  </p>
                  <p className="text-muted-foreground mt-1.5">
                    {formatDisplayDate(notice.publishedAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <Link to="/timetable" className="block">
              <div className="p-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      View Full Timetable
                    </p>
                    <p className="text-muted-foreground">
                      See weekly class schedule
                    </p>
                  </div>
                </div>
              </div>
            </Link>
            <Link to="/attendance" className="block">
              <div className="p-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Mark Attendance
                    </p>
                    <p className="text-muted-foreground">
                      Record student attendance for your classes
                    </p>
                  </div>
                </div>
              </div>
            </Link>
            <Link to="/marks-entry" className="block">
              <div className="p-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Enter Marks
                    </p>
                    <p className="text-muted-foreground">
                      Record exam marks for your subjects
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}