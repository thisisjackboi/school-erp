"use client";

import React from "react";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { DUMMY_TRANSPORT_ROUTES } from "@/lib/dummy-data";
import { Bus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export default function TransportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Transport & Bus Fleet Management</h1>
          <p className="text-xs text-muted-foreground">Manage bus routes, stop lists, vehicle registrations, driver info & transport allocations.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Route / Bus
        </Button>
      </div>

      <EnterpriseTable
        data={DUMMY_TRANSPORT_ROUTES}
        columns={[
          { header: "Route No", accessorKey: "routeNo" },
          { header: "Route Name", accessorKey: "routeName" },
          { header: "Vehicle Plate", accessorKey: "vehicleNo" },
          { header: "Driver Name", accessorKey: "driverName" },
          { header: "Driver Phone", accessorKey: "driverPhone" },
          { header: "Bus Capacity", cell: (r) => `${r.assignedStudentsCount} / ${r.capacity} Seats` },
          { header: "Monthly Transport Fee", cell: (r) => formatCurrency(r.monthlyFee) },
        ]}
      />
    </div>
  );
}
