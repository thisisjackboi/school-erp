import type { ExamResult, Grade, Mark } from "./types/marks";
import type { ExamSchedule } from "./types/exam";

export interface StudentWithEnrollment {
  enrollmentId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  rollNumber: string | null;
  admissionNumber: string;
}

export interface SubjectMarkRow {
  subject: string;
  marks: number;
  maxMarks: number;
  passingMarks: number;
  isAbsent: boolean;
}

export interface StudentResultRow {
  student: StudentWithEnrollment;
  result: ExamResult | null;
  subjectMarks: SubjectMarkRow[];
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: Grade | null;
  rank: number | null;
  status: string;
}

/**
 * Aggregates a student's marks across all schedules of an exam into a
 * result row (totals, percentage, grade, rank). Shared by the Marks work-
 * flow page and the standalone Results page so the two never drift apart.
 */
export function buildStudentResults(params: {
  students: StudentWithEnrollment[];
  examResults: ExamResult[];
  allMarks: Mark[];
  examSchedules: ExamSchedule[];
  selectedExamId: string;
  grades: Grade[];
}): StudentResultRow[] {
  const resultsMap = new Map(
    params.examResults.filter((r) => r.examId === params.selectedExamId).map((r) => [r.studentEnrollmentId, r])
  );
  const schedulesForExam = params.examSchedules.filter((s) => s.examId === params.selectedExamId);
  const scheduleIds = new Set(schedulesForExam.map((s) => s.id));
  const scheduleSubjectsMap = new Map(schedulesForExam.map((s) => [s.id, s]));

  const rows: StudentResultRow[] = params.students.map((stu) => {
    const result = resultsMap.get(stu.enrollmentId) || null;
    const studentMarks = params.allMarks.filter(
      (m) => m.studentEnrollmentId === stu.enrollmentId && scheduleIds.has(m.examScheduleId)
    );

    const subjectMarks = studentMarks.map((m) => {
      const sched = scheduleSubjectsMap.get(m.examScheduleId);
      return {
        subject: sched?.subject?.name || "N/A",
        marks: m.isAbsent ? 0 : Number(m.marksObtained || 0),
        maxMarks: sched ? Number(sched.maxMarks) : 0,
        passingMarks: sched ? Number(sched.passingMarks) : 0,
        isAbsent: m.isAbsent,
      };
    });

    const totalObtained = subjectMarks.reduce((sum, sm) => sum + sm.marks, 0);
    const totalMax = subjectMarks.reduce((sum, sm) => sum + sm.maxMarks, 0);
    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

    let grade: Grade | null = null;
    if (result?.gradeId) {
      grade = params.grades.find((g) => g.id === result.gradeId) || null;
    }
    if (!grade && percentage > 0) {
      grade =
        [...params.grades]
          .sort((a, b) => b.minPercent - a.minPercent)
          .find((g) => percentage >= Number(g.minPercent) && percentage <= Number(g.maxPercent)) || null;
    }

    return {
      student: stu,
      result,
      subjectMarks,
      totalObtained,
      totalMax,
      percentage,
      grade,
      rank: result?.rankInSection || null,
      status: result?.resultStatus || "PENDING",
    };
  });

  const withResults = rows.filter((r) => r.result);
  withResults.sort((a, b) => b.percentage - a.percentage);
  withResults.forEach((r, i) => {
    r.rank = i + 1;
  });

  return rows.sort((a, b) => (a.rank || 9999) - (b.rank || 9999));
}

/** True when a pending student is marked absent for every scheduled subject (nothing to aggregate). */
export function isAbsentOnly(row: StudentResultRow): boolean {
  return row.subjectMarks.length > 0 && row.subjectMarks.every((sm) => sm.isAbsent);
}