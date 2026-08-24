"use client";

import React from "react";
import { MetricCard } from "@/components/enterprise/metric-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { StatusChip } from "@/components/enterprise/status-chip";
import {
  DUMMY_LIBRARY_BOOKS,
  DUMMY_BOOK_CHECKOUTS,
  DUMMY_VISITOR_PASSES,
  DUMMY_TRANSPORT_ROUTES,
  DUMMY_HOSTEL_ROOMS,
  DUMMY_TIMETABLE,
  DUMMY_CLASSES,
} from "@/lib/dummy-data";
import { Library, BookOpen, UserSearch, Bus, Building2, Shield, CalendarDays, Award } from "lucide-react";

export function LibrarianDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Library Books" value="14,250" change="45 Categories" icon={Library} iconBg="bg-blue-50 text-blue-600" />
        <MetricCard title="Active Issued Books" value="482 Books" change="38 Overdue" icon={BookOpen} iconBg="bg-amber-50 text-amber-600" />
        <MetricCard title="Overdue Fine Collected" value="₹ 4,850" change="This Month" icon={BookOpen} iconBg="bg-emerald-50 text-emerald-600" />
        <MetricCard title="New Arrivals" value="120 Titles" change="Science & Fiction" icon={Library} iconBg="bg-purple-50 text-purple-600" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-bold">Book Borrowing Log</CardTitle></CardHeader>
        <CardContent>
          <EnterpriseTable
            data={DUMMY_BOOK_CHECKOUTS}
            columns={[
              { header: "Book Title", accessorKey: "bookTitle" },
              { header: "Borrower", accessorKey: "borrowerName" },
              { header: "Role", accessorKey: "borrowerRole" },
              { header: "Issue Date", accessorKey: "issueDate" },
              { header: "Due Date", accessorKey: "dueDate" },
              { header: "Status", cell: (r) => <StatusChip status={r.status} /> },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function ReceptionistDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Active Visitors Today" value="14 Visitors" change="2 Currently in campus" icon={UserSearch} iconBg="bg-blue-50 text-blue-600" />
        <MetricCard title="Gate Passes Issued" value="45 Passes" change="100% ID Verified" icon={UserSearch} iconBg="bg-emerald-50 text-emerald-600" />
        <MetricCard title="Admission Inquiries" value="12 Inquiries" change="Grade 1 to 11" icon={UserSearch} iconBg="bg-purple-50 text-purple-600" />
        <MetricCard title="Phone Calls Logged" value="28 Calls" change="Parent queries resolved" icon={UserSearch} iconBg="bg-amber-50 text-amber-600" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-bold">Today Visitor Gate Passes</CardTitle></CardHeader>
        <CardContent>
          <EnterpriseTable
            data={DUMMY_VISITOR_PASSES}
            columns={[
              { header: "Pass No", accessorKey: "passNo" },
              { header: "Visitor Name", accessorKey: "visitorName" },
              { header: "Phone", accessorKey: "phone" },
              { header: "Purpose", accessorKey: "purpose" },
              { header: "Person to Meet", accessorKey: "personToMeet" },
              { header: "Check In", accessorKey: "checkInTime" },
              { header: "Status", cell: (r) => <StatusChip status={r.status} /> },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function TransportDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total School Fleet" value="18 Buses" change="100% GPS Enabled" icon={Bus} iconBg="bg-amber-50 text-amber-600" />
        <MetricCard title="Active Bus Routes" value="14 Routes" change="Delhi NCR Coverage" icon={Bus} iconBg="bg-blue-50 text-blue-600" />
        <MetricCard title="Students Availing Transport" value="540 Students" change="88% Occupancy" icon={Bus} iconBg="bg-emerald-50 text-emerald-600" />
        <MetricCard title="Drivers & Attendants" value="24 Crew" change="Valid DL & Fitness" icon={Bus} iconBg="bg-purple-50 text-purple-600" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-bold">Transport Fleet Routes</CardTitle></CardHeader>
        <CardContent>
          <EnterpriseTable
            data={DUMMY_TRANSPORT_ROUTES}
            columns={[
              { header: "Route No", accessorKey: "routeNo" },
              { header: "Route Name", accessorKey: "routeName" },
              { header: "Vehicle No", accessorKey: "vehicleNo" },
              { header: "Driver", accessorKey: "driverName" },
              { header: "Driver Phone", accessorKey: "driverPhone" },
              { header: "Students", accessorKey: "assignedStudentsCount" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function HostelDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Hostel Blocks" value="2 Blocks" change="Nalanda & Gargi" icon={Building2} iconBg="bg-purple-50 text-purple-600" />
        <MetricCard title="Total Resident Students" value="142 Students" change="88 Boys, 54 Girls" icon={Building2} iconBg="bg-blue-50 text-blue-600" />
        <MetricCard title="Available Rooms" value="18 Rooms" change="Ready for allotment" icon={Building2} iconBg="bg-emerald-50 text-emerald-600" />
        <MetricCard title="Mess Menu Status" value="Special Menu" change="Friday Dinner" icon={Building2} iconBg="bg-amber-50 text-amber-600" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-bold">Hostel Room Occupancy</CardTitle></CardHeader>
        <CardContent>
          <EnterpriseTable
            data={DUMMY_HOSTEL_ROOMS}
            columns={[
              { header: "Block", accessorKey: "blockName" },
              { header: "Room No", accessorKey: "roomNo" },
              { header: "Type", accessorKey: "roomType" },
              { header: "Capacity", accessorKey: "capacity" },
              { header: "Occupied", accessorKey: "occupied" },
              { header: "Warden", accessorKey: "wardenName" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function VicePrincipalDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="School Discipline Score" value="98.5%" change="0 Serious Incidents" icon={Shield} iconBg="bg-blue-50 text-blue-600" />
        <MetricCard title="Substitute Allocations" value="3 Handled" change="All classes covered" icon={CalendarDays} iconBg="bg-emerald-50 text-emerald-600" />
        <MetricCard title="Late Student Arrivals" value="4 Students" change="Passes issued" icon={Shield} iconBg="bg-amber-50 text-amber-600" />
        <MetricCard title="Assembly Conduct" value="Excellent" change="Class 10 Lead" icon={Award} iconBg="bg-purple-50 text-purple-600" />
      </div>
    </div>
  );
}

export function AcademicCoordinatorDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Syllabus Coverage" value="74%" change="Term 1 On Track" icon={BookOpen} iconBg="bg-emerald-50 text-emerald-600" />
        <MetricCard title="Term Exam Schedules" value="Published" change="Sept 15 - Sept 25" icon={CalendarDays} iconBg="bg-blue-50 text-blue-600" />
        <MetricCard title="Subject Assignments" value="100% Mapped" change="32 Subjects" icon={BookOpen} iconBg="bg-purple-50 text-purple-600" />
        <MetricCard title="Question Paper Audits" value="Approved" change="Grades 9 to 12" icon={Award} iconBg="bg-amber-50 text-amber-600" />
      </div>
    </div>
  );
}

export function ClassTeacherDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="My Class Roster" value="Grade 10-A" change="38 Students" icon={Award} iconBg="bg-blue-50 text-blue-600" />
        <MetricCard title="Today Class Attendance" value="96.5%" change="36 Present, 2 Absent" icon={Award} iconBg="bg-emerald-50 text-emerald-600" />
        <MetricCard title="Report Cards Progress" value="Generated" change="Term 1 Marksheets" icon={Award} iconBg="bg-purple-50 text-purple-600" />
        <MetricCard title="Parent Communications" value="5 Messages" change="Sent via portal" icon={Award} iconBg="bg-amber-50 text-amber-600" />
      </div>
    </div>
  );
}
