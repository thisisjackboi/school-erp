"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useRole } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { User, Mail, Shield, Save } from "lucide-react";

export default function ProfilePage() {
  const { roleDetails } = useRole();
  const { toast } = useToast();

  const handleSave = () => {
    toast("Profile Updated!", "Your profile information has been updated.", "success");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">User Account Profile</h1>
          <p className="text-xs text-muted-foreground">Manage active account settings, password & contact information.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center p-6 space-y-4">
          <Avatar fallback={roleDetails.name.substring(0, 2).toUpperCase()} size="lg" className="mx-auto h-20 w-20 text-xl font-bold" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{roleDetails.name} User</h2>
            <p className="text-xs text-muted-foreground mt-0.5">user@{roleDetails.id}.school.edu</p>
            <span className={`inline-block mt-2 text-xs px-2.5 py-0.5 rounded font-semibold ${roleDetails.badgeColor}`}>
              {roleDetails.name}
            </span>
          </div>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-sm font-bold">Account Information</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Full Name</label>
                <Input defaultValue={`${roleDetails.name} User`} maxLength={50} placeholder="Enter full name" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Email Address</label>
                <Input type="email" defaultValue={`user@${roleDetails.id}.school.edu`} maxLength={120} placeholder="Enter email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Phone Number</label>
                <Input inputMode="tel" defaultValue="+91 98765 43210" maxLength={15} placeholder="Enter phone" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Assigned Role Context</label>
                <Input value={roleDetails.name} disabled className="bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-xs">
              <Save className="mr-1.5 h-3.5 w-3.5" /> Save Profile Details
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
