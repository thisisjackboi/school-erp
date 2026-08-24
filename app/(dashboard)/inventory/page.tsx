"use client";

import React from "react";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { Boxes, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InventoryPage() {
  const inventoryData = [
    { id: "INV-01", itemCode: "ASSET-101", itemName: "Dell Core i5 Desktop Computer", category: "IT Hardware", quantity: 45, unit: "Units", location: "Computer Lab 1", status: "In Stock" },
    { id: "INV-02", itemCode: "ASSET-102", itemName: "Epson Interactive Classroom Projector", category: "Electronics", quantity: 28, unit: "Units", location: "Smart Classrooms", status: "In Stock" },
    { id: "INV-03", itemCode: "ASSET-103", itemName: "A4 Printing Paper Reams (80 GSM)", category: "Stationery", quantity: 120, unit: "Reams", location: "Main Store Room", status: "Reorder Needed" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Inventory & Asset Tracking</h1>
          <p className="text-xs text-muted-foreground">Manage school physical assets, lab equipment stock, stationery & stock issuances.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Inventory Item
        </Button>
      </div>

      <EnterpriseTable
        data={inventoryData}
        columns={[
          { header: "Item Code", accessorKey: "itemCode" },
          { header: "Item Name", accessorKey: "itemName" },
          { header: "Category", accessorKey: "category" },
          { header: "Quantity", cell: (r) => `${r.quantity} ${r.unit}` },
          { header: "Location", accessorKey: "location" },
          { header: "Stock Status", cell: (r) => <span className={`px-2 py-0.5 rounded font-semibold text-xs ${r.status === "In Stock" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{r.status}</span> },
        ]}
      />
    </div>
  );
}
