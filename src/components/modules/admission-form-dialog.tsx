"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { StepForm } from "@/components/enterprise/step-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { UserPlus, ArrowRight, ArrowLeft, Check } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { createAdmission, updateAdmission } from "@/lib/api/admissions.api";
import { getClasses } from "@/lib/api/classes.api";
import { getAcademicSessions } from "@/lib/api/academic-sessions.api";

import type { Admission } from "@/lib/types/admission";
import type { SchoolClass } from "@/lib/types/class";
import type { AcademicSession } from "@/lib/types/academic-session";

interface AdmissionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admission?: Admission | null;
  onSuccess?: () => void;
}

export function AdmissionFormDialog({
  open,
  onOpenChange,
  admission = null,
  onSuccess,
}: AdmissionFormDialogProps) {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [academicSessions, setAcademicSessions] = useState<AcademicSession[]>(
    [],
  );
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    applicationNumber: "",
    firstName: "",
    lastName: "",
    dob: "",
    gender: "MALE",
    applyingForClassId: "",
    academicSessionId: "",
    guardianName: "",
    guardianPhone: "",
  });

  const isEditMode = !!admission;

  const steps = [
    {
      title: "Student Info",
      description: "Name, DOB & Class",
    },
    {
      title: "Guardian Details",
      description: "Contact information",
    },
    {
      title: "Review",
      description: "Verify application",
    },
  ];

  useEffect(() => {
    if (!open || !accessToken) {
      return;
    }

    if (admission) {
      setFormData({
        applicationNumber: admission.applicationNumber || "",
        firstName: admission.applicantFirstName || "",
        lastName: admission.applicantLastName || "",
        dob: admission.dateOfBirth ? admission.dateOfBirth.substring(0, 10) : "",
        gender: admission.gender || "MALE",
        applyingForClassId: admission.applyingForClassId || "",
        academicSessionId: admission.academicSessionId || "",
        guardianName: admission.guardianName || "",
        guardianPhone: admission.guardianPhone || "",
      });
    } else {
      setFormData({
        applicationNumber: "",
        firstName: "",
        lastName: "",
        dob: "",
        gender: "MALE",
        applyingForClassId: "",
        academicSessionId: "",
        guardianName: "",
        guardianPhone: "",
      });
    }
    setCurrentStep(0);

    const loadOptions = async () => {
      setIsLoadingOptions(true);
      setError(null);

      try {
        const [classesData, sessionsData] = await Promise.all([
          getClasses(accessToken),
          getAcademicSessions(accessToken),
        ]);

        setClasses(classesData);
        setAcademicSessions(sessionsData);

        if (!admission) {
          const currentSession = sessionsData.find(
            (session) => session.isCurrent,
          );

          if (currentSession) {
            setFormData((current) => ({
              ...current,
              academicSessionId: current.academicSessionId || currentSession.id,
            }));
          } else if (sessionsData.length > 0) {
            setFormData((current) => ({
              ...current,
              academicSessionId: current.academicSessionId || sessionsData[0].id,
            }));
          }
        }
      } catch (error) {
        console.error("Failed to load admission options", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load classes and academic sessions",
        );
      } finally {
        setIsLoadingOptions(false);
      }
    };

    void loadOptions();
  }, [open, accessToken, admission]);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const validateCurrentStep = () => {
    setError(null);

    if (currentStep === 0) {
      if (!formData.applicationNumber.trim()) {
        setError("Application number is required.");
        return false;
      }

      if (!formData.firstName.trim()) {
        setError("First name is required.");
        return false;
      }

      if (!formData.lastName.trim()) {
        setError("Last name is required.");
        return false;
      }

      if (!formData.dob) {
        setError("Date of birth is required.");
        return false;
      }

      if (!formData.applyingForClassId) {
        setError("Please select a class.");
        return false;
      }

      if (!formData.academicSessionId) {
        setError("Please select an academic session.");
        return false;
      }
    }

    if (currentStep === 1) {
      if (!formData.guardianName.trim()) {
        setError("Guardian name is required.");
        return false;
      }

      if (!formData.guardianPhone.trim()) {
        setError("Guardian phone is required.");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((current) => current + 1);
    }
  };

  const handleSubmit = async () => {
    if (!accessToken) {
      setError("Authentication session expired. Please login again.");
      return;
    }

    if (!validateCurrentStep()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isEditMode && admission) {
        const updated = await updateAdmission(
          admission.id,
          {
            applicantFirstName: formData.firstName.trim(),
            applicantLastName: formData.lastName.trim(),
            dateOfBirth: formData.dob,
            gender: formData.gender as "MALE" | "FEMALE" | "OTHER",
            applyingForClassId: formData.applyingForClassId,
            academicSessionId: formData.academicSessionId,
            guardianName: formData.guardianName.trim(),
            guardianPhone: formData.guardianPhone.trim(),
          },
          accessToken,
        );

        toast(
          "Admission Updated Successfully",
          `Application No: ${updated.applicationNumber}`,
          "success",
        );
      } else {
        const created = await createAdmission(
          {
            applicationNumber: formData.applicationNumber.trim(),
            applicantFirstName: formData.firstName.trim(),
            applicantLastName: formData.lastName.trim(),
            dateOfBirth: formData.dob,
            gender: formData.gender as "MALE" | "FEMALE" | "OTHER",
            applyingForClassId: formData.applyingForClassId,
            academicSessionId: formData.academicSessionId,
            guardianName: formData.guardianName.trim(),
            guardianPhone: formData.guardianPhone.trim(),
          },
          accessToken,
        );

        toast(
          "Admission Created Successfully",
          `Application No: ${created.applicationNumber}`,
          "success",
        );
      }

      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save admission", error);

      setError(
        error instanceof Error ? error.message : "Failed to save admission",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);

    setFormData({
      applicationNumber: "",
      firstName: "",
      lastName: "",
      dob: "",
      gender: "MALE",
      applyingForClassId: "",
      academicSessionId: "",
      guardianName: "",
      guardianPhone: "",
    });

    setError(null);
  };

  const handleClose = (value: boolean) => {
    if (isSaving) {
      return;
    }

    onOpenChange(value);

    if (!value) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5 text-blue-600" />
          <span>{isEditMode ? "Edit Admission Application" : "New Student Admission Application"}</span>
        </DialogTitle>

        <DialogDescription>
          {isEditMode ? "Update the admission application details." : "Create a new admission application."}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4">
        <StepForm
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        >
          {currentStep === 0 && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="font-semibold block mb-1">
                  Application Number *
                </label>

                <Input
                  placeholder="e.g. ADM-2026-001"
                  value={formData.applicationNumber}
                  disabled={isEditMode}
                  onChange={(event) =>
                    updateField("applicationNumber", event.target.value)
                  }
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">First Name *</label>

                <Input
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(event) =>
                    updateField("firstName", event.target.value)
                  }
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Last Name *</label>

                <Input
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(event) =>
                    updateField("lastName", event.target.value)
                  }
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  Date of Birth *
                </label>

                <Input
                  type="date"
                  value={formData.dob}
                  onChange={(event) => updateField("dob", event.target.value)}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Gender *</label>

                <select
                  value={formData.gender}
                  onChange={(event) =>
                    updateField("gender", event.target.value)
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  Applying For Class *
                </label>

                <select
                  value={formData.applyingForClassId}
                  onChange={(event) =>
                    updateField("applyingForClassId", event.target.value)
                  }
                  disabled={isLoadingOptions}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="">
                    {isLoadingOptions ? "Loading classes..." : "Select class"}
                  </option>

                  {classes.map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  Academic Session *
                </label>

                <select
                  value={formData.academicSessionId}
                  onChange={(event) =>
                    updateField("academicSessionId", event.target.value)
                  }
                  disabled={isLoadingOptions}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="">
                    {isLoadingOptions
                      ? "Loading sessions..."
                      : "Select session"}
                  </option>

                  {academicSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                      {session.isCurrent ? " (Current)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="font-semibold block mb-1">
                  Guardian Name *
                </label>

                <Input
                  placeholder="Parent / Guardian full name"
                  value={formData.guardianName}
                  onChange={(event) =>
                    updateField("guardianName", event.target.value)
                  }
                />
              </div>

              <div className="col-span-2">
                <label className="font-semibold block mb-1">
                  Guardian Phone *
                </label>

                <Input
                  placeholder="9876543210"
                  value={formData.guardianPhone}
                  onChange={(event) =>
                    updateField("guardianPhone", event.target.value)
                  }
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3 text-xs">
              <div className="rounded-lg border p-4 space-y-2">
                <h3 className="font-bold">Application Summary</h3>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">
                      Application No:
                    </span>{" "}
                    <strong>{formData.applicationNumber}</strong>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Student:</span>{" "}
                    <strong>
                      {formData.firstName} {formData.lastName}
                    </strong>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Class:</span>{" "}
                    <strong>
                      {
                        classes.find(
                          (item) => item.id === formData.applyingForClassId,
                        )?.name
                      }
                    </strong>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Session:</span>{" "}
                    <strong>
                      {
                        academicSessions.find(
                          (item) => item.id === formData.academicSessionId,
                        )?.name
                      }
                    </strong>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Guardian:</span>{" "}
                    <strong>{formData.guardianName}</strong>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    <strong>{formData.guardianPhone}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </StepForm>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <DialogFooter>
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentStep((current) => Math.max(current - 1, 0))
            }
            disabled={currentStep === 0 || isSaving}
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              size="sm"
              onClick={handleNext}
              disabled={isLoadingOptions || isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Next Step
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Check className="mr-1 h-3.5 w-3.5" />
              {isSaving ? "Saving..." : isEditMode ? "Update Admission" : "Submit Admission"}
            </Button>
          )}
        </div>
      </DialogFooter>
    </Dialog>
  );
}
