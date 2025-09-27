"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SignatureData } from "../SignatureDesigner";

interface CompanyFormProps {
  company: SignatureData['company'];
  onUpdate: (field: keyof SignatureData['company'], value: string) => void;
  onValidationChange: (formName: string, isValid: boolean) => void;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({ company, onUpdate, onValidationChange }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    validateForm();
  }, [company]); // Re-validate when company data changes

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!company.businessName.trim()) {
      newErrors.businessName = "Business Name is required.";
    }
    if (!company.logoUrl.trim()) {
      newErrors.logoUrl = "Logo URL is required.";
    }
    if (!company.brandColorPrimary.trim()) {
      newErrors.brandColorPrimary = "Primary Brand Color is required.";
    }
    if (!company.brandColorAccent.trim()) {
      newErrors.brandColorAccent = "Accent Brand Color is required.";
    }
    if (!company.brandColorText.trim()) {
      newErrors.brandColorText = "Text Color is required.";
    }
    setErrors(newErrors);
    onValidationChange("CompanyForm", Object.keys(newErrors).length === 0);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof SignatureData['company'], value: string) => {
    onUpdate(field, value);
  };

  return (
    <div className="space-y-4 mb-6 p-4 border border-border rounded-lg shadow-xl bg-card transition-all duration-200 hover:shadow-2xl hover:translate-y-[-2px]">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Company</h3>
      <div>
        <Label htmlFor="businessName" className="mb-1 block text-muted-foreground">Business Name</Label>
        <Input
          id="businessName"
          value={company.businessName}
          onChange={(e) => handleChange("businessName", e.target.value)}
          placeholder="e.g., Acme Corp"
          className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200 hover:border-primary"
        />
        {errors.businessName && <p className="text-destructive text-sm mt-1">{errors.businessName}</p>}
      </div>
      <div>
        <Label htmlFor="tagline" className="mb-1 block text-muted-foreground">Tagline (Optional)</Label>
        <Input
          id="tagline"
          value={company.tagline}
          onChange={(e) => handleChange("tagline", e.target.value)}
          placeholder="e.g., Innovating the Future"
          className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200 hover:border-primary"
        />
      </div>
      <div>
        <Label htmlFor="logoUrl" className="mb-1 block text-muted-foreground">Logo URL (Placeholder)</Label>
        <Input
          id="logoUrl"
          value={company.logoUrl}
          onChange={(e) => handleChange("logoUrl", e.target.value)}
          placeholder="e.g., https://yourcompany.com/logo.png"
          className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200 hover:border-primary"
        />
        {errors.logoUrl && <p className="text-destructive text-sm mt-1">{errors.logoUrl}</p>}
        <p className="text-sm text-muted-foreground mt-1">
          (Actual image upload will be implemented later)
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="brandColorPrimary" className="mb-1 block text-muted-foreground">Primary Brand Color</Label>
          <Input
            id="brandColorPrimary"
            type="color"
            value={company.brandColorPrimary}
            onChange={(e) => handleChange("brandColorPrimary", e.target.value)}
            className="h-10 w-full p-1 cursor-pointer rounded-md border border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200 hover:border-primary"
          />
          {errors.brandColorPrimary && <p className="text-destructive text-sm mt-1">{errors.brandColorPrimary}</p>}
        </div>
        <div>
          <Label htmlFor="brandColorAccent" className="mb-1 block text-muted-foreground">Accent Brand Color</Label>
          <Input
            id="brandColorAccent"
            type="color"
            value={company.brandColorAccent}
            onChange={(e) => handleChange("brandColorAccent", e.target.value)}
            className="h-10 w-full p-1 cursor-pointer rounded-md border border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200 hover:border-primary"
          />
          {errors.brandColorAccent && <p className="text-destructive text-sm mt-1">{errors.brandColorAccent}</p>}
        </div>
        <div>
          <Label htmlFor="brandColorText" className="mb-1 block text-muted-foreground">Text Color</Label>
          <Input
            id="brandColorText"
            type="color"
            value={company.brandColorText}
            onChange={(e) => handleChange("brandColorText", e.target.value)}
            className="h-10 w-full p-1 cursor-pointer rounded-md border border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200 hover:border-primary"
          />
          {errors.brandColorText && <p className="text-destructive text-sm mt-1">{errors.brandColorText}</p>}
        </div>
      </div>
    </div>
  );
};