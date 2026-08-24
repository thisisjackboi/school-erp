"use client";

import React from "react";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { DUMMY_HOSTEL_ROOMS } from "@/lib/dummy-data";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export default function HostelPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Hostel & Boarding Administration</h1>
          <p className="text-xs text-muted-foreground">Manage hostel blocks, room occupancy, student allocations & warden monitoring.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Room Allocation
        </Button>
      </div>

      <EnterpriseTable
        data={DUMMY_HOSTEL_ROOMS}
        columns={[
          { header: "Hostel Block", accessorKey: "blockName" },
          { header: "Room No", accessorKey: "roomNo" },
          { header: "Floor", cell: (r) => `Floor ${r.floor}` },
          { header: "Room Type", accessorKey: "roomType" },
          { header: "Occupancy", cell: (r) => `${r.occupied} / ${r.capacity} Occupied` },
          { header: "Monthly Rent", cell: (r) => formatCurrency(r.monthlyRent) },
          { header: "Warden In-Charge", accessorKey: "wardenName" },
        ]}
      />
    </div>
  );
}
