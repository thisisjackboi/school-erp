"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ROLES, MODULE_ROUTES } from "@/lib/permissions";
import { Settings, Save, ShieldCheck, School } from "lucide-react";

import {
  LIMITS,
  firstError,
  onlyCode,
  trimMax,
  validateMaxLength,
  validateRequired,
} from "@/lib/input-restrictions";

export default function SettingsPage() {
  const { toast } = useToast();
  const [schoolName, setSchoolName] = useState("PrismaEd+ Senior Secondary School");
  const [schoolCode, setSchoolCode] = useState("CBSE-54109");
  const [phone, setPhone] = useState("+91 11 2612 3456");
  const [address, setAddress] = useState("Sector 4, Vasant Vihar, New Delhi - 110057");

  const handleSave = () => {
    const error = firstError(
      validateRequired(schoolName, "Institution name"),
      validateMaxLength(schoolName, "Institution name", LIMITS.TITLE_MAX),
      validateRequired(schoolCode, "Affiliation code"),
      validateMaxLength(schoolCode, "Affiliation code", LIMITS.CODE_MAX),
      validateMaxLength(phone, "Official phone", LIMITS.PHONE_INTL_MAX),
      validateRequired(address, "Campus address"),
      validateMaxLength(address, "Campus address", LIMITS.ADDRESS_MAX),
    );
    if (error) {
      toast("Cannot save settings", error, "error");
      return;
    }
    toast("School Settings Updated!", "School profile & configuration saved successfully.", "success");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">School Profile & System Settings</h1>
          <p className="text-xs text-muted-foreground">Configure institutional metadata, branding header, academic session rules & role permission matrix.</p>
        </div>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-xs">
          <Save className="mr-1.5 h-3.5 w-3.5" /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center space-x-2">
              <School className="h-4 w-4 text-blue-600" />
              <span>School Profile & Branding</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <label className="font-semibold block mb-1">Institution Name</label>
              <Input maxLength={LIMITS.TITLE_MAX} value={schoolName} onChange={(e) => setSchoolName(trimMax(e.target.value, LIMITS.TITLE_MAX))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Affiliation Code</label>
                <Input maxLength={LIMITS.CODE_MAX} value={schoolCode} onChange={(e) => setSchoolCode(onlyCode(e.target.value, LIMITS.CODE_MAX))} />
              </div>
              <div>
                <label className="font-semibold block mb-1">Official Phone</label>
                <Input maxLength={LIMITS.PHONE_INTL_MAX} value={phone} onChange={(e) => setPhone(trimMax(e.target.value, LIMITS.PHONE_INTL_MAX))} />
              </div>
            </div>
            <div>
              <label className="font-semibold block mb-1">Campus Address</label>
              <Input maxLength={LIMITS.ADDRESS_MAX} value={address} onChange={(e) => setAddress(trimMax(e.target.value, LIMITS.ADDRESS_MAX))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Role Permissions Matrix Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-muted-foreground">The ERP enforces strict frontend permission scoping across 14 user roles.</p>
            <div className="border rounded-lg max-h-56 overflow-y-auto p-2 space-y-2 bg-slate-50 dark:bg-slate-900">
              {ROLES.map((r) => (
                <div key={r.id} className="p-2 rounded bg-card border flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{r.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${r.badgeColor}`}>{r.id}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
