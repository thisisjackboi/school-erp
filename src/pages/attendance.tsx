"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  School,
  CalendarDays,
  UserRound,
  Sparkles,
  BookOpen,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

import { getAcademicSessions } from "@/lib/api/academic-sessions.api";
import { getClasses } from "@/lib/api/classes.api";
import { getSections } from "@/lib/api/sections.api";
import { getStudents } from "@/lib/api/students.api";
import { getPeriods, getTimetableSlots } from "@/lib/api/timetable.api";
import {
  getStudentAttendance,
  bulkMarkStudentAttendance,
} from "@/lib/api/student-attendance.api";

import type { AcademicSession } from "@/lib/types/academic-session";
import type { SchoolClass } from "@/lib/types/class";
import type { Section } from "@/lib/types/section";
import type { StudentRecord } from "@/lib/types/student";
import type { Period, TimetableSlot } from "@/lib/types/timetable";
import type { AttendanceStatus, StudentAttendance } from "@/lib/types/student-attendance";

interface LocalStudentAttendanceState {
  studentEnrollmentId: string;
  studentId: string;
  rollNumber: string;
  studentName: string;
  admissionNumber: string;
  status: AttendanceStatus;
  remarks: string;
  existingRecordId?: string;
}

const isUUID = (str?: string | null): boolean =>
  !!str &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    str,
  );

export default function AttendancePage() {
  const { accessToken, user } = useAuth();

  // Master Data States
  const [academicSessions, setAcademicSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);

  // Selection States
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");

  // Attendance Sheet State
  const [studentAttendanceList, setStudentAttendanceList] = useState<
    LocalStudentAttendanceState[]
  >([]);
  const [isExistingRecord, setIsExistingRecord] = useState<boolean>(false);

  // Status & Filter States
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState<string>("");

  // 1. Initial Master Data Loading
  useEffect(() => {
    const loadMasterData = async () => {
      if (!accessToken) return;

      setIsLoadingMaster(true);
      setError(null);

      try {
        const [sessionData, classData, sectionData, periodData, slotsData] =
          await Promise.all([
            getAcademicSessions(accessToken),
            getClasses(accessToken),
            getSections(accessToken),
            getPeriods(accessToken).catch(() => []),
            getTimetableSlots(accessToken).catch(() => []),
          ]);

        setAcademicSessions(sessionData);
        setClasses(classData);
        setSections(sectionData);
        setPeriods(periodData.sort((a, b) => a.sortOrder - b.sortOrder));
        setTimetableSlots(slotsData);

        // Auto-select current session
        const currentSession =
          sessionData.find((s) => s.isCurrent) || sessionData[0];
        if (currentSession) {
          setSelectedSessionId(currentSession.id);

          // Find first class with sections
          const validClass = classData[0];
          if (validClass) {
            setSelectedClassId(validClass.id);
            const validSecs = sectionData.filter(
              (sec) =>
                sec.classId === validClass.id &&
                sec.academicSessionId === currentSession.id,
            );
            if (validSecs.length > 0) {
              setSelectedSectionId(validSecs[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load master attendance data", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load master attendance data",
        );
      } finally {
        setIsLoadingMaster(false);
      }
    };

    void loadMasterData();
  }, [accessToken]);

  // Derived available sections for current session & class
  const availableSections = useMemo(() => {
    if (!selectedClassId) return [];
    return sections.filter((sec) => {
      const matchClass = sec.classId === selectedClassId;
      const matchSession =
        !selectedSessionId || sec.academicSessionId === selectedSessionId;
      return matchClass && matchSession;
    });
  }, [sections, selectedClassId, selectedSessionId]);

  // Available periods (fallback to standard period list if no slots exist)
  const availablePeriods = useMemo(() => {
    if (periods.length > 0) return periods;
    // Default standard school period fallbacks if database table is empty
    return [
      {
        id: "p1",
        name: "Period 1",
        startTime: "08:00",
        endTime: "08:45",
        sortOrder: 1,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "p2",
        name: "Period 2",
        startTime: "08:45",
        endTime: "09:30",
        sortOrder: 2,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "p3",
        name: "Period 3",
        startTime: "09:30",
        endTime: "10:15",
        sortOrder: 3,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "p4",
        name: "Period 4",
        startTime: "10:30",
        endTime: "11:15",
        sortOrder: 4,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "p5",
        name: "Period 5",
        startTime: "11:15",
        endTime: "12:00",
        sortOrder: 5,
        createdAt: "",
        updatedAt: "",
      },
    ];
  }, [periods]);

  // Auto-select first period when availablePeriods updates or resets
  useEffect(() => {
    if (availablePeriods.length > 0 && !selectedPeriodId) {
      setSelectedPeriodId(availablePeriods[0].id);
    }
  }, [availablePeriods, selectedPeriodId]);

  // Hierarchical Filter Change Handlers
  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);

    // Reset Class, Section, and Period
    const validClass = classes[0];
    if (validClass) {
      setSelectedClassId(validClass.id);
      const validSecs = sections.filter(
        (sec) => sec.classId === validClass.id && sec.academicSessionId === sessionId,
      );
      setSelectedSectionId(validSecs.length > 0 ? validSecs[0].id : "");
    } else {
      setSelectedClassId("");
      setSelectedSectionId("");
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);

    // Reset Section and Period
    const validSecs = sections.filter(
      (sec) =>
        sec.classId === classId &&
        (!selectedSessionId || sec.academicSessionId === selectedSessionId),
    );
    setSelectedSectionId(validSecs.length > 0 ? validSecs[0].id : "");
  };

  const handleSectionChange = (sectionId: string) => {
    setSelectedSectionId(sectionId);
  };

  // Timetable Slot / Subject Context for selected period & section
  const currentSlotContext = useMemo(() => {
    if (!selectedSectionId || !selectedPeriodId) return null;
    const match = timetableSlots.find(
      (slot) =>
        slot.periodId === selectedPeriodId &&
        slot.teacherSubjectAssignment?.sectionId === selectedSectionId,
    );
    return match || null;
  }, [timetableSlots, selectedSectionId, selectedPeriodId]);

  // Active Period Details
  const activePeriod = useMemo(() => {
    return availablePeriods.find((p) => p.id === selectedPeriodId) || null;
  }, [availablePeriods, selectedPeriodId]);

  // Active Class & Section Objects
  const activeClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) || null,
    [classes, selectedClassId],
  );
  const activeSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId) || null,
    [sections, selectedSectionId],
  );

  // Load Students and Existing Attendance Records
  useEffect(() => {
    const loadStudentSheet = async () => {
      if (!accessToken || !selectedClassId || !selectedSectionId) {
        setStudentAttendanceList([]);
        return;
      }

      setIsLoadingStudents(true);
      setError(null);
      setSuccessMessage(null);

      try {
        // Fetch enrolled students for section
        const fetchedStudents = await getStudents(accessToken, {
          academicSessionId: selectedSessionId || undefined,
          classId: selectedClassId,
          sectionId: selectedSectionId,
        });

        setStudents(fetchedStudents);

        // Fetch existing attendance records if saved
        let existingRecords: StudentAttendance[] = [];
        if (selectedDate && selectedPeriodId) {
          existingRecords = await getStudentAttendance(accessToken, {
            attendanceDate: selectedDate,
            sectionId: selectedSectionId,
            classId: selectedClassId,
            periodId: isUUID(selectedPeriodId) ? selectedPeriodId : undefined,
          }).catch(() => []);
        }

        setIsExistingRecord(existingRecords.length > 0);

        // Map students to local attendance state
        const mappedSheet: LocalStudentAttendanceState[] = fetchedStudents.map(
          (std, index) => {
            const rollNo =
              std.enrollment?.rollNumber ||
              String(index + 1).padStart(2, "0");
            const enrollmentId = std.enrollment?.id || "";

            // Check if attendance record already exists for student
            const existing = existingRecords.find(
              (rec) =>
                (enrollmentId && rec.studentEnrollmentId === enrollmentId) ||
                rec.studentEnrollment?.student?.id === std.id,
            );

            return {
              studentEnrollmentId: enrollmentId,
              studentId: std.id,
              rollNumber: rollNo,
              studentName: `${std.firstName} ${std.lastName}`,
              admissionNumber: std.admissionNumber,
              status: existing ? existing.status : "PRESENT",
              remarks: existing?.remarks || "",
              existingRecordId: existing?.id,
            };
          },
        );

        setStudentAttendanceList(mappedSheet);
      } catch (err) {
        console.error("Failed to load attendance sheet", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load student attendance sheet",
        );
      } finally {
        setIsLoadingStudents(false);
      }
    };

    void loadStudentSheet();
  }, [accessToken, selectedSessionId, selectedClassId, selectedSectionId, selectedDate, selectedPeriodId]);

  // Attendance Actions
  const handleStatusChange = (
    studentEnrollmentId: string,
    newStatus: AttendanceStatus,
  ) => {
    setStudentAttendanceList((prev) =>
      prev.map((item) =>
        item.studentEnrollmentId === studentEnrollmentId
          ? { ...item, status: newStatus }
          : item,
      ),
    );
  };

  const handleRemarkChange = (studentEnrollmentId: string, remark: string) => {
    setStudentAttendanceList((prev) =>
      prev.map((item) =>
        item.studentEnrollmentId === studentEnrollmentId
          ? { ...item, remarks: remark }
          : item,
      ),
    );
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setStudentAttendanceList((prev) =>
      prev.map((item) => ({ ...item, status })),
    );
  };

  // Period Navigation Actions
  const handlePreviousPeriod = () => {
    const currentIndex = availablePeriods.findIndex(
      (p) => p.id === selectedPeriodId,
    );
    if (currentIndex > 0) {
      setSelectedPeriodId(availablePeriods[currentIndex - 1].id);
    }
  };

  const handleNextPeriod = () => {
    const currentIndex = availablePeriods.findIndex(
      (p) => p.id === selectedPeriodId,
    );
    if (currentIndex >= 0 && currentIndex < availablePeriods.length - 1) {
      setSelectedPeriodId(availablePeriods[currentIndex + 1].id);
    }
  };

  // Live Summary Statistics
  const summaryStats = useMemo(() => {
    const total = studentAttendanceList.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;
    let excused = 0;

    studentAttendanceList.forEach((item) => {
      if (item.status === "PRESENT") present++;
      else if (item.status === "ABSENT") absent++;
      else if (item.status === "LATE") late++;
      else if (item.status === "HALF_DAY") halfDay++;
      else if (item.status === "EXCUSED") excused++;
    });

    return { total, present, absent, late, halfDay, excused };
  }, [studentAttendanceList]);

  // Filtered Students for Search Bar
  const filteredStudents = useMemo(() => {
    const query = studentSearch.toLowerCase().trim();
    if (!query) return studentAttendanceList;
    return studentAttendanceList.filter(
      (item) =>
        item.studentName.toLowerCase().includes(query) ||
        item.rollNumber.toLowerCase().includes(query) ||
        item.admissionNumber.toLowerCase().includes(query),
    );
  }, [studentAttendanceList, studentSearch]);

  // Submit Attendance Payload to Backend
  const handleSaveAttendance = async () => {
    if (!accessToken || !selectedDate || !selectedSectionId) {
      setError("Please ensure Class, Section, Date, and Period are selected.");
      return;
    }

    if (studentAttendanceList.length === 0) {
      setError("No students available to record attendance.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const validStudentRecords = studentAttendanceList.filter(
        (item) => isUUID(item.studentEnrollmentId) && item.studentEnrollmentId !== item.studentId,
      );

      if (validStudentRecords.length === 0) {
        setError(
          "No valid student enrollments found for the selected Class and Section. Please ensure students are enrolled before saving attendance.",
        );
        setIsSaving(false);
        return;
      }

      const recordsPayload = validStudentRecords.map((item) => ({
        studentEnrollmentId: item.studentEnrollmentId,
        status: item.status,
        remarks: item.remarks || undefined,
      }));

      await bulkMarkStudentAttendance(
        {
          attendanceDate: selectedDate,
          attendanceType: "PERIOD",
          periodId: isUUID(selectedPeriodId) ? selectedPeriodId : undefined,
          timetableSlotId: isUUID(currentSlotContext?.id)
            ? currentSlotContext?.id
            : undefined,
          subjectId: isUUID(
            currentSlotContext?.teacherSubjectAssignment?.subjectId,
          )
            ? currentSlotContext?.teacherSubjectAssignment?.subjectId
            : undefined,
          markedByEmployeeId: undefined,
          records: recordsPayload,
        },
        accessToken,
      );

      setSuccessMessage(
        `Successfully saved attendance for ${activeClass?.name} - Section ${activeSection?.name} (${activePeriod?.name || "Period"}).`,
      );
      setIsExistingRecord(true);
    } catch (err) {
      console.error("Failed to save student attendance", err);
      setError(
        err instanceof Error ? err.message : "Failed to save student attendance",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            Attendance Register
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record and manage period-wise student attendance records.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setSelectedDate(new Date().toISOString().split("T")[0])
          }
          className="self-start sm:self-auto text-xs border-slate-300 dark:border-slate-700"
        >
          <Calendar className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
          Today ({new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })})
        </Button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 1: FILTER BAR */}
      <Card className="shadow-xs border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <School className="h-3.5 w-3.5 text-blue-600" />
            Attendance Context Selection
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* 1. Academic Session */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Academic Session
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => handleSessionChange(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {academicSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name} {session.isCurrent ? "(Current)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Class */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Section */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Section
              </label>
              <select
                value={selectedSectionId}
                onChange={(e) => handleSectionChange(e.target.value)}
                disabled={!selectedClassId || availableSections.length === 0}
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-900"
              >
                <option value="">
                  {!selectedClassId
                    ? "Select Class First"
                    : availableSections.length === 0
                    ? "No Sections Found"
                    : "Select Section"}
                </option>
                {availableSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    Section {sec.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Date */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* 5. Period */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Period
              </label>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {availablePeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.startTime} - {p.endTime})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: CONTEXT BANNER & PERIOD SWITCHER */}
      {selectedClassId && selectedSectionId && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-blue-900 dark:text-blue-200">
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[11px]">
                {activeClass?.name} • Section {activeSection?.name}
              </span>
              <span className="text-slate-400">•</span>
              <span>{selectedDate}</span>
              <span className="text-slate-400">•</span>
              <span className="text-blue-700 dark:text-blue-300 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {activePeriod?.name} ({activePeriod?.startTime}–{activePeriod?.endTime})
              </span>
              {currentSlotContext?.teacherSubjectAssignment?.subject && (
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-200">
                  {currentSlotContext.teacherSubjectAssignment.subject.name}
                </span>
              )}
            </div>

            {currentSlotContext?.teacherSubjectAssignment?.employee && (
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                Teacher: {currentSlotContext.teacherSubjectAssignment.employee.firstName}{" "}
                {currentSlotContext.teacherSubjectAssignment.employee.lastName}
              </p>
            )}

            {isExistingRecord && (
              <p className="text-[11px] text-green-700 dark:text-green-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                Attendance already recorded for this period (Editable)
              </p>
            )}
          </div>

          {/* Period Navigation Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreviousPeriod}
              disabled={
                availablePeriods.findIndex((p) => p.id === selectedPeriodId) <= 0
              }
              className="text-xs border-blue-200 hover:bg-blue-100 dark:border-blue-800 dark:hover:bg-blue-900/50"
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" />
              Previous Period
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNextPeriod}
              disabled={
                availablePeriods.findIndex((p) => p.id === selectedPeriodId) >=
                availablePeriods.length - 1
              }
              className="text-xs border-blue-200 hover:bg-blue-100 dark:border-blue-800 dark:hover:bg-blue-900/50"
            >
              Next Period
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* SECTION 3: STUDENT ATTENDANCE TABLE & QUICK MARKING */}
      <Card className="shadow-xs border-slate-200 dark:border-slate-800">
        <CardHeader className="border-b bg-slate-50/50 pb-4 dark:bg-slate-900/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Toolbar: Search + Quick Marking Actions */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search student or roll no..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Quick Marking Buttons */}
            {studentAttendanceList.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                  Quick Mark:
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAll("PRESENT")}
                  className="text-xs border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-green-600" />
                  Mark All Present
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAll("ABSENT")}
                  className="text-xs border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                >
                  Mark All Absent
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingMaster || isLoadingStudents ? (
            <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <p>Loading student attendance sheet...</p>
            </div>
          ) : !selectedClassId || !selectedSectionId ? (
            <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
              <School className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Please select Class and Section above
              </p>
              <p className="text-[11px]">
                Choose your target class and section to record student attendance.
              </p>
            </div>
          ) : studentAttendanceList.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
              <UserRound className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                No students enrolled in this section
              </p>
              <p className="text-[11px]">
                No active student records found for {activeClass?.name} - Section{" "}
                {activeSection?.name}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-slate-100/70 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                  <tr>
                    <th className="px-6 py-3 font-semibold w-16 text-center">Roll No</th>
                    <th className="px-6 py-3 font-semibold">Student Name</th>
                    <th className="px-6 py-3 font-semibold">Admission No</th>
                    <th className="px-6 py-3 font-semibold">Attendance Choice</th>
                    <th className="px-6 py-3 font-semibold">Remarks / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredStudents.map((item) => (
                    <tr
                      key={item.studentEnrollmentId}
                      className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/50"
                    >
                      {/* Roll Number */}
                      <td className="px-6 py-3.5 text-center font-bold font-mono text-slate-800 dark:text-slate-200">
                        {item.rollNumber}
                      </td>

                      {/* Student Name */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {item.studentName.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {item.studentName}
                          </span>
                        </div>
                      </td>

                      {/* Admission Number */}
                      <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {item.admissionNumber}
                      </td>

                      {/* Compact Attendance Choice Buttons */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(
                                item.studentEnrollmentId,
                                "PRESENT",
                              )
                            }
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${
                              item.status === "PRESENT"
                                ? "bg-green-600 text-white border-green-600 shadow-2xs"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                            }`}
                          >
                            Present
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(
                                item.studentEnrollmentId,
                                "ABSENT",
                              )
                            }
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${
                              item.status === "ABSENT"
                                ? "bg-red-600 text-white border-red-600 shadow-2xs"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                            }`}
                          >
                            Absent
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(
                                item.studentEnrollmentId,
                                "LATE",
                              )
                            }
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${
                              item.status === "LATE"
                                ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                            }`}
                          >
                            Late
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(
                                item.studentEnrollmentId,
                                "HALF_DAY",
                              )
                            }
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${
                              item.status === "HALF_DAY"
                                ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                            }`}
                          >
                            Half Day
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(
                                item.studentEnrollmentId,
                                "EXCUSED",
                              )
                            }
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${
                              item.status === "EXCUSED"
                                ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                            }`}
                          >
                            Excused
                          </button>
                        </div>
                      </td>

                      {/* Remarks Note */}
                      <td className="px-6 py-3.5">
                        <input
                          type="text"
                          placeholder="Optional reason..."
                          value={item.remarks}
                          onChange={(e) =>
                            handleRemarkChange(
                              item.studentEnrollmentId,
                              e.target.value,
                            )
                          }
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 4: LIVE SUMMARY STATISTICS & SAVE BAR */}
      {studentAttendanceList.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Live Summary Chips */}
          <div className="flex items-center gap-3 flex-wrap text-xs font-semibold">
            <span className="text-slate-700 dark:text-slate-300 font-bold mr-1">
              Attendance Summary:
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              Total: {summaryStats.total}
            </span>
            <span className="px-2.5 py-1 rounded bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300">
              Present: {summaryStats.present}
            </span>
            <span className="px-2.5 py-1 rounded bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
              Absent: {summaryStats.absent}
            </span>
            <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              Late: {summaryStats.late}
            </span>
            {summaryStats.halfDay > 0 && (
              <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                Half Day: {summaryStats.halfDay}
              </span>
            )}
            {summaryStats.excused > 0 && (
              <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                Excused: {summaryStats.excused}
              </span>
            )}
          </div>

          {/* Save Button */}
          <Button
            type="button"
            onClick={handleSaveAttendance}
            disabled={isSaving || studentAttendanceList.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-6 py-2 shadow-xs font-bold"
          >
            <UserCheck className="mr-2 h-4 w-4" />
            {isSaving ? "Saving Attendance..." : "Save Attendance"}
          </Button>
        </div>
      )}
    </div>
  );
}
