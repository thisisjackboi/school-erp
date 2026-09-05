"use client";

import React, { useState } from "react";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { DUMMY_VISITOR_PASSES } from "@/lib/dummy-data";
import { UserSearch, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

import {
  LIMITS,
  firstError,
  onlyDigits,
  onlyName,
  trimMax,
  validateMaxLength,
  validateName,
  validatePhone,
  validateRequired,
} from "@/lib/input-restrictions";

export default function VisitorsPage() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [passes, setPasses] = useState(DUMMY_VISITOR_PASSES);
  const [visitorName, setVisitorName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [personToMeet, setPersonToMeet] = useState("");

  const handleIssuePass = () => {
    const error = firstError(
      validateRequired(visitorName, "Visitor name"),
      validateName(visitorName, "Visitor name"),
      validateMaxLength(visitorName, "Visitor name", LIMITS.NAME_MAX),
      ...(phone.trim() ? [validatePhone(phone)] : []),
      validateMaxLength(purpose, "Purpose", LIMITS.TEXT_MAX),
      validateMaxLength(personToMeet, "Person to meet", LIMITS.NAME_MAX),
    );
    if (error) {
      toast("Cannot issue pass", error, "error");
      return;
    }
    const newPass = {
      id: `VIS-${Math.floor(100 + Math.random() * 900)}`,
      passNo: `VP-2026-${Math.floor(100 + Math.random() * 900)}`,
      visitorName,
      phone: phone || "+91 98100 00000",
      purpose: purpose || "General Inquiry",
      personToMeet: personToMeet || "Receptionist",
      checkInTime: "11:30 AM",
      status: "Checked In" as const,
      idProofType: "Aadhaar Card",
      gateNo: "Gate 1",
    };
    setPasses([newPass, ...passes]);
    toast("Gate Pass Issued!", `Visitor Pass ${newPass.passNo} created.`, "success");
    setIsOpen(false);
    setVisitorName("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Visitors & Front Office Gate Register</h1>
          <p className="text-xs text-muted-foreground">Issue visitor gate passes, verify ID proofs & log campus entry check-ins.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Issue Visitor Gate Pass
        </Button>
      </div>

      <EnterpriseTable
        data={passes}
        columns={[
          { header: "Pass No", accessorKey: "passNo", sortable: true },
          { header: "Visitor Name", accessorKey: "visitorName" },
          { header: "Phone Number", accessorKey: "phone" },
          { header: "Purpose of Visit", accessorKey: "purpose" },
          { header: "Person to Meet", accessorKey: "personToMeet" },
          { header: "Check In Time", accessorKey: "checkInTime" },
          { header: "Status", cell: (r) => <StatusChip status={r.status} /> },
        ]}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogHeader>
          <DialogTitle>Issue Visitor Gate Pass</DialogTitle>
          <DialogDescription>Record visitor details at Front Office Gate 1.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Visitor Full Name *</label>
            <Input placeholder="e.g. Ramesh Kumar" maxLength={LIMITS.NAME_MAX} value={visitorName} onChange={(e) => setVisitorName(onlyName(e.target.value, LIMITS.NAME_MAX))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Phone Number</label>
              <Input inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 9876543210" maxLength={LIMITS.PHONE_MAX} value={phone} onChange={(e) => setPhone(onlyDigits(e.target.value, LIMITS.PHONE_MAX))} />
            </div>
            <div>
              <label className="font-semibold block mb-1">Person / Dept to Meet</label>
              <Input placeholder="e.g. Principal / Accountant" maxLength={LIMITS.NAME_MAX} value={personToMeet} onChange={(e) => setPersonToMeet(onlyName(e.target.value, LIMITS.NAME_MAX))} />
            </div>
          </div>
          <div>
            <label className="font-semibold block mb-1">Purpose of Visit</label>
            <Input placeholder="Admission inquiry, document submission..." maxLength={LIMITS.TEXT_MAX} value={purpose} onChange={(e) => setPurpose(trimMax(e.target.value, LIMITS.TEXT_MAX))} />
          </div>
        </div>
        <DialogFooter>
          <Button size="sm" onClick={handleIssuePass} className="bg-blue-600 hover:bg-blue-700">Issue Pass</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
