export interface DashboardSlot {
  slotId: string;
  periodId: string;
  periodName: string;
  sortOrder: number;
  startTime: string;
  endTime: string;
  time: string;
  assignmentId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  room: string | null;
}

export interface DashboardDay {
  date: string;
  dayOfWeek: number;
  dayName: string;
  isToday: boolean;
  slots: DashboardSlot[];
}

export interface DashboardSubjectPerSection {
  sectionId: string;
  sectionName: string;
  subjects: {
    assignmentId: string;
    subjectId: string;
    name: string;
    code: string;
    isElective: boolean;
  }[];
}

export interface DashboardSubjectGroup {
  classId: string;
  className: string;
  sections: DashboardSubjectPerSection[];
}

export interface DashboardNotice {
  id: string;
  title: string;
  body: string;
  audience: string;
  publishedAt: string;
  publishedByEmployee?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface DashboardBase {
  role: string;
  notices: DashboardNotice[];
  notifications: { unreadCount: number };
}

export interface TeacherDashboard extends DashboardBase {
  role: "TEACHER";
  profile: {
    employeeId: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    phone: string;
    designation: string | null;
    status: string;
  };
  currentSession: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  subjects: DashboardSubjectGroup[];
  today: DashboardDay;
  upcoming: DashboardDay[];
}

export interface DashboardTimetableResponse {
  from: string | null;
  to: string | null;
  days: DashboardDay[];
}

export interface AccountantSummary {
  todayCollections: number;
  monthCollections: number;
  monthIncome: number;
  monthExpense: number;
  netCash: number;
  outstandingBalance: number;
  overdueCount: number;
  defaultersCount: number;
}

export interface RecentCollection {
  id: string;
  receiptNumber: string;
  studentName: string;
  className: string;
  sectionName: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
  transactionReference: string | null;
}

export interface RecentExpense {
  id: string;
  category: string;
  amount: number;
  expenseDate: string;
  paidTo: string | null;
  recordedBy: string | null;
}

export interface AccountantDashboard extends DashboardBase {
  role: "ACCOUNTANT";
  profile: {
    employeeId: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    phone: string;
    designation: string | null;
    status: string;
  };
  currentSession: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  summary: AccountantSummary;
  recentCollections: RecentCollection[];
  recentExpenses: RecentExpense[];
}