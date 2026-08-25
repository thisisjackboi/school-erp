export type UserRole =
  | "administrator"
  | "principal"
  | "vice_principal"
  | "academic_coordinator"
  | "accountant"
  | "hr_manager"
  | "teacher"
  | "class_teacher"
  | "librarian"
  | "receptionist"
  | "transport_manager"
  | "hostel_warden"
  | "student"
  | "parent";

export interface RoleInfo {
  id: UserRole;
  name: string;
  description: string;
  badgeColor: string;
}

export interface Student {
  id: string;
  admissionNo: string;
  rollNo: string;
  name: string;
  gender: "Male" | "Female" | "Other";
  dob: string;
  grade: string; // e.g. "Grade 10"
  section: string; // e.g. "A"
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  bloodGroup: string;
  admissionDate: string;
  status: "Active" | "Inactive" | "Graduated" | "Suspended";
  avatar: string;
  feeStatus: "Paid" | "Pending" | "Partial" | "Overdue";
  attendancePercentage: number;
  hostelResident: boolean;
  busRoute?: string;
}

export interface Teacher {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  subjectsHandled: string[];
  primaryClassTeacherOf?: string; // e.g. "10-A"
  qualification: string;
  joinDate: string;
  status: "Active" | "On Leave" | "Resigned";
  avatar: string;
  salary: number;
}

export interface Parent {
  id: string;
  name: string;
  relationship: "Father" | "Mother" | "Guardian";
  phone: string;
  email: string;
  occupation: string;
  children: Array<{
    studentId: string;
    studentName: string;
    grade: string;
    section: string;
  }>;
}

export interface ClassSection {
  id: string;
  grade: string;
  section: string;
  classTeacherName: string;
  classTeacherId: string;
  studentCount: number;
  roomNo: string;
  capacity: number;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  grade: string;
  type: "Core" | "Elective" | "Practical" | "Co-Curricular";
  teachersAssigned: string[];
  weeklyHours: number;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  grade: string;
  section: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  status: "Present" | "Absent" | "Late" | "Half Day" | "Excused";
  remarks?: string;
}

export interface HomeworkAssignment {
  id: string;
  title: string;
  subject: string;
  grade: string;
  section: string;
  teacherName: string;
  assignedDate: string;
  dueDate: string;
  description: string;
  totalSubmissions: number;
  totalStudents: number;
  attachmentName?: string;
}

export interface TimetableSlot {
  id: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  period: number; // 1 to 8
  startTime: string;
  endTime: string;
  grade: string;
  section: string;
  subject: string;
  teacherName: string;
  roomNo: string;
}

export interface FeeInvoice {
  id: string;
  invoiceNo: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  grade: string;
  section: string;
  term: string; // e.g. "Term 1 (2026-27)"
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  paymentDate?: string;
  status: "Paid" | "Pending" | "Partial" | "Overdue";
  paymentMethod?: "Cash" | "UPI" | "Card" | "Bank Transfer" | "Cheque";
}

export interface FinancialEntry {
  id: string;
  type: "Income" | "Expense";
  category: string;
  title: string;
  amount: number;
  date: string;
  approvedBy: string;
  paymentMode: string;
  referenceNo: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: "Paid" | "Processing" | "Pending";
  paymentDate?: string;
}

export interface LeaveRequest {
  id: string;
  applicantName: string;
  applicantType: "Teacher" | "Staff" | "Student";
  role: string;
  leaveType: "Casual" | "Sick" | "Maternity" | "Earned" | "Emergency";
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedOn: string;
  approvedBy?: string;
}

export interface LibraryBook {
  id: string;
  accessionNo: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  publisher: string;
  copiesTotal: number;
  copiesAvailable: number;
  rackLocation: string;
}

export interface BookCheckout {
  id: string;
  bookId: string;
  bookTitle: string;
  borrowerName: string;
  borrowerRole: "Student" | "Teacher";
  borrowerId: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: "Issued" | "Returned" | "Overdue";
  fineAmount: number;
}

export interface TransportRoute {
  id: string;
  routeNo: string;
  routeName: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  assignedStudentsCount: number;
  monthlyFee: number;
  stops: string[];
}

export interface HostelRoom {
  id: string;
  blockName: string;
  roomNo: string;
  floor: number;
  roomType: "Single" | "Double" | "Triple" | "Dormitory";
  capacity: number;
  occupied: number;
  monthlyRent: number;
  wardenName: string;
}

export interface VisitorPass {
  id: string;
  passNo: string;
  visitorName: string;
  phone: string;
  purpose: string;
  personToMeet: string;
  checkInTime: string;
  checkOutTime?: string;
  status: "Checked In" | "Checked Out";
  idProofType: string;
  gateNo: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  publishedDate: string;
  targetAudience: "All" | "Students" | "Teachers" | "Parents" | "Staff";
  priority: "Normal" | "High" | "Urgent";
  authorName: string;
}

export interface ExamSchedule {
  id: string;
  examName: string; // e.g., "Mid-Term Examination 2026"
  grade: string;
  subject: string;
  examDate: string;
  startTime: string;
  duration: string;
  maxMarks: number;
  passingMarks: number;
  roomNo: string;
}

export interface StudentMark {
  id: string;
  examName: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  grade: string;
  section: string;
  subject: string;
  marksObtained: number;
  maxMarks: number;
  gradeLetter: string;
  remarks: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  module: string;
  ipAddress: string;
}
