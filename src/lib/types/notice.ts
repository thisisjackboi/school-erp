export type NoticeAudience =
  | "ALL"
  | "STUDENTS"
  | "EMPLOYEES"
  | "GUARDIANS"
  | "SPECIFIC_CLASS";

export type NoticeCategory =
  | "ACADEMIC"
  | "EXAMINATION"
  | "FEES"
  | "TRANSPORT"
  | "EVENT"
  | "SPORTS"
  | "GENERAL";

export interface Notice {
  id: string;

  title: string;

  body: string;

  audience: NoticeAudience;

  category: NoticeCategory;

  classId: string | null;

  publishedByEmployeeId: string | null;

  publishedAt: string;

  expiresAt: string | null;

  createdAt: string;

  updatedAt: string;

  class: {
    id: string;
    name: string;
  } | null;

  publishedByEmployee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  } | null;
}

export interface NoticeListFilters {
  page?: number;
  limit?: number;
  search?: string;
  audience?: NoticeAudience;
  category?: NoticeCategory;
}

export interface CreateNoticePayload {
  title: string;
  body: string;
  audience: NoticeAudience;
  category: NoticeCategory;
  classId?: string;
  expiresAt?: string;
}

export type UpdateNoticePayload = Partial<CreateNoticePayload>;

export const NOTICE_AUDIENCE_LABELS: Record<NoticeAudience, string> = {
  ALL: "Everyone",
  STUDENTS: "Students",
  EMPLOYEES: "Employees",
  GUARDIANS: "Guardians",
  SPECIFIC_CLASS: "Specific class",
};

export const NOTICE_CATEGORY_LABELS: Record<NoticeCategory, string> = {
  ACADEMIC: "Academic",
  EXAMINATION: "Examination",
  FEES: "Fees",
  TRANSPORT: "Transport",
  EVENT: "Event",
  SPORTS: "Sports",
  GENERAL: "General",
};

export const NOTICE_AUDIENCE_OPTIONS = Object.entries(
  NOTICE_AUDIENCE_LABELS,
) as [NoticeAudience, string][];

export const NOTICE_CATEGORY_OPTIONS = Object.entries(
  NOTICE_CATEGORY_LABELS,
) as [NoticeCategory, string][];
