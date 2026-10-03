/**
 * Types mirroring the `student-promotions` backend module. Keep in sync with
 * `src/modules/student-promotions` in the backend repository.
 */

export type PromotionOutcome =
  | "PROMOTED"
  | "RETAINED"
  | "TRANSFERRED_OUT"
  | "WITHDRAWN"
  | "GRADUATED";

/** Outcomes that open a new enrollment in the destination session. */
export const ENROLLING_OUTCOMES: PromotionOutcome[] = ["PROMOTED", "RETAINED"];

/** Outcomes that end the student's time at the school. */
export const TERMINAL_OUTCOMES: PromotionOutcome[] = [
  "TRANSFERRED_OUT",
  "WITHDRAWN",
  "GRADUATED",
];

export const PROMOTION_OUTCOME_LABELS: Record<PromotionOutcome, string> = {
  PROMOTED: "Promoted to next class",
  RETAINED: "Retained in same class",
  TRANSFERRED_OUT: "Transferred out",
  WITHDRAWN: "Withdrawn",
  GRADUATED: "Graduated",
};

export const PROMOTION_OUTCOME_HINTS: Record<PromotionOutcome, string> = {
  PROMOTED: "Closes the current enrollment and opens a new one in the chosen class and section.",
  RETAINED: "Stays in the same class but moves into the new session with a new enrollment.",
  TRANSFERRED_OUT: "Ends the enrollment. History is kept, and no new enrollment is created.",
  WITHDRAWN: "Ends the enrollment and marks the student inactive. History is kept.",
  GRADUATED: "Ends the enrollment and marks the student graduated. History is kept.",
};

export function createsNewEnrollment(outcome: PromotionOutcome): boolean {
  return ENROLLING_OUTCOMES.includes(outcome);
}

export interface PromotionSessionOption {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface PromotionClassOption {
  id: string;
  name: string;
  displayOrder: number;
}

export interface PromotionSectionOption {
  id: string;
  name: string;
  classId: string;
  academicSessionId: string;
  capacity: number | null;
  class: PromotionClassOption;
  academicSession: { id: string; name: string };
}

export interface PromotionScopeOptions {
  sessions: PromotionSessionOption[];
  classes: PromotionClassOption[];
  sections: PromotionSectionOption[];
}

export interface PromotionPreviewStudent {
  studentId: string;
  enrollmentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  currentRollNumber: string | null;
  suggestedOutcome: PromotionOutcome;
  suggestedClassId: string | null;
  suggestedClassName: string | null;
  suggestedSectionId: string | null;
  suggestedRollNumber: string | null;
  conflict: "ALREADY_ENROLLED_IN_TARGET_SESSION" | null;
  hasTransportAllocation: boolean;
  hasHostelAllocation: boolean;
}

export interface PromotionPreview {
  from: {
    session: PromotionSessionOption;
    class: PromotionClassOption;
    section: { id: string; name: string };
  };
  to: {
    session: PromotionSessionOption;
    suggestedClass: PromotionClassOption | null;
    suggestedSectionId: string | null;
    destinationSections: PromotionSectionOption[];
    hasDestinationSections: boolean;
    /** Roll numbers already used in the suggested destination section. */
    takenRollNumbers: string[];
    /** Roll numbers already used, keyed by destination section id. */
    takenRollNumbersBySection: Record<string, string[]>;
    nextFreeRollNumber: string | null;
  };
  counts: {
    students: number;
    conflicts: number;
    withTransport: number;
    withHostel: number;
  };
  students: PromotionPreviewStudent[];
}

export interface PromotionDecisionPayload {
  studentId: string;
  outcome: PromotionOutcome;
  toClassId?: string;
  toSectionId?: string;
  rollNumber?: string;
  remarks?: string;
}

export interface ExecutePromotionPayload {
  fromSessionId: string;
  fromClassId: string;
  fromSectionId: string;
  toSessionId: string;
  decisions: PromotionDecisionPayload[];
}

export interface PromotionResultRow {
  studentId: string;
  outcome: PromotionOutcome;
  success: boolean;
  toEnrollmentId: string | null;
  carriedRouteStopId: string | null;
  carriedBedId: string | null;
}

export interface ExecutePromotionResult {
  batchId: string;
  toSession: { id: string; name: string; startDate: string };
  promoted: number;
  byOutcome: Record<string, number>;
  carriedTransport: number;
  carriedHostel: number;
  results: PromotionResultRow[];
}

/** One audit row as returned by the history endpoints. */
export interface PromotionHistoryRow {
  id: string;
  batchId: string;
  studentId: string;
  outcome: PromotionOutcome;
  fromEnrollmentId: string;
  toEnrollmentId: string | null;
  fromSessionId: string;
  toSessionId: string;
  fromClassId: string;
  toClassId: string | null;
  fromSectionId: string;
  toSectionId: string | null;
  fromRollNumber: string | null;
  toRollNumber: string | null;
  carriedRouteStopId: string | null;
  carriedBedId: string | null;
  remarks: string | null;
  promotedAt: string;
  revertedAt: string | null;
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
  };
  fromEnrollment: { id: string; rollNumber: string | null; status: string };
  toEnrollment: { id: string; rollNumber: string | null } | null;
  fromSession: { id: string; name: string };
  toSession: { id: string; name: string };
  fromClass: { id: string; name: string; displayOrder: number };
  toClass: { id: string; name: string; displayOrder: number } | null;
  fromSection: { id: string; name: string };
  toSection: { id: string; name: string } | null;
  carriedRouteStop: { id: string; stopName: string } | null;
  carriedBed: { id: string; bedNumber: string } | null;
  promotedBy: { id: string; username: string };
  revertedBy: { id: string; username: string } | null;
}
