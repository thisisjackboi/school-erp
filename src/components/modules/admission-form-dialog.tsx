"use client";

import React, { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { StepForm } from "@/components/enterprise/step-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { UserPlus, Upload, ArrowRight, ArrowLeft, Check } from "lucide-react";

interface AdmissionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdmissionFormDialog({ open, onOpenChange }: AdmissionFormDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "Male",
    gradeApplying: "Grade 10",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    address: "",
    previousSchool: "",
  });

  const steps = [
    { title: "Student Info", description: "Name, DOB & Gender" },
    { title: "Parent Details", description: "Contact & Address" },
    { title: "Previous School", description: "Academic History" },
    { title: "Upload Docs", description: "Birth Cert & Photos" },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // Submit Form
      toast("Student Admission Submitted Successfully!", `Admission Reg No: ADM-2026-${Math.floor(100 + Math.random() * 900)}`, "success");
      onOpenChange(false);
      setCurrentStep(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5 text-blue-600" />
          <span>New Student Admission Application</span>
        </DialogTitle>
        <DialogDescription>
          Complete the step-by-step admission application form for academic session 2026-2027.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4">
        <StepForm steps={steps} currentStep={currentStep} onStepClick={(s) => setCurrentStep(s)}>
          {currentStep === 0 && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">First Name *</label>
                <Input
                  placeholder="e.g. Aarav"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Last Name *</label>
                <Input
                  placeholder="e.g. Sharma"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Date of Birth *</label>
                <Input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="font-semibold block mb-1">Grade Applying For *</label>
                <select
                  value={formData.gradeApplying}
                  onChange={(e) => setFormData({ ...formData, gradeApplying: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11 Science/Commerce</option>
                  <option value="Grade 12">Grade 12 Science/Commerce</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="font-semibold block mb-1">Parent / Guardian Full Name *</label>
                <Input
                  placeholder="e.g. Rajesh Sharma"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Mobile Phone Number *</label>
                <Input
                  placeholder="+91 98765 43210"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Email Address</label>
                <Input
                  placeholder="parent@example.com"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="font-semibold block mb-1">Residential Address *</label>
                <Input
                  placeholder="House No, Street, Colony, City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="font-semibold block mb-1">Previous School Name</label>
                <Input
                  placeholder="e.g. St. Xavier's High School"
                  value={formData.previousSchool}
                  onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Last Grade Attended</label>
                <Input placeholder="Grade 9" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Overall Percentage / CGPA</label>
                <Input placeholder="92.4%" />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-3 text-xs">
              <div className="p-4 border-2 border-dashed border-border rounded-lg text-center bg-slate-50 dark:bg-slate-900/50">
                <Upload className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="font-bold text-slate-800 dark:text-slate-200">Upload Birth Certificate & Transfer Certificate</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Drag & drop files or click to browse (PDF, JPG up to 5MB)</p>
                <Button size="sm" variant="outline" className="mt-3 text-xs">Choose File</Button>
              </div>
            </div>
          )}
        </StepForm>
      </div>

      <DialogFooter>
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep((s) => Math.max(s - 1, 0))}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
          </Button>

          <Button size="sm" onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
            {currentStep === steps.length - 1 ? (
              <>
                <Check className="mr-1 h-3.5 w-3.5" /> Submit Admission
              </>
            ) : (
              <>
                Next Step <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </DialogFooter>
    </Dialog>
  );
}
