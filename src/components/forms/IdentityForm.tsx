"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SignatureData } from "../SignatureDesigner";

interface IdentityFormProps {
  identity: SignatureData['identity'];
  onUpdate: (field: keyof SignatureData['identity'], value: string) => void;
  onValidationChange: (formName: string, isValid: boolean) => void;
}

export const IdentityForm: React.FC<IdentityFormProps> = ({ identity, onUpdate, onValidationChange }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    validateForm();
  }, [identity]); // Re-validate when identity data changes

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!identity.fullName.trim()) {
      newErrors.fullName = "Full Name is required.";
    }
    if (!identity.jobTitle.trim()) {
      newErrors.jobTitle = "Job Title is required.";
    }
    setErrors(newErrors);
    onValidationChange("IdentityForm", Object.keys(newErrors).length === 0);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof SignatureData['identity'], value: string) => {
    onUpdate(field, value);
  };

  return (
    <div className="space-y-4 mb-6 p-4 border border-border rounded-lg shadow-xl bg-card transition-all duration-200 hover:shadow-2xl hover:translate-y-[-2px]">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Identity</h3>
      <div>
        <Label htmlFor="fullName" className="mb-1 block text-muted-foreground">Full Name</Label>
        <Input
          id="fullName"
          value={identity.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          placeholder="e.g., Jane Doe"
          className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200"
        />
        {errors.fullName && <p className="text-destructive text-sm mt-1">{errors.fullName}</p>}
      </div>
      <div>
        <Label htmlFor="jobTitle" className="mb-1 block text-muted-foreground">Job Title</Label>
        <Input
          id="jobTitle"
          value={identity.jobTitle}
          onChange={(e) => handleChange("jobTitle", e.target.value)}
          placeholder="e.g., Senior Developer"
          className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200"
        />
        {errors.jobTitle && <p className="text-destructive text-sm mt-1">{errors.jobTitle}</p>}
      </div>
      <div>
        <Label htmlFor="pronouns" className="mb-1 block text-muted-foreground">Pronouns (Optional)</Label>
        <Input
          id="pronouns"
          value={identity.pronouns}
          onChange={(e) => handleChange("pronouns", e.target.value)}
          placeholder="e.g., she/her"
          className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200"
        />
      </div>
      <div>
        <Label htmlFor="department" className="mb-1 block text-muted-foreground">Department (Optional)</Label>
        <Input
          id="department"
          value={identity.department}
          onChange={(e) => handleChange("department", e.target.value)}
          placeholder="e.g., Marketing"
          className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200"
        />
      </div>
    </div>
  );
};