"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SignatureData } from "../SignatureDesigner";

interface CompanyFormProps {
  company: SignatureData['company'];
  onUpdate: (field: keyof SignatureData['company'], value: string) => void;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({ company, onUpdate }) => {
  return (
    <div className="space-y-4 mb-6 p-4 border rounded-md bg-card">
      <h3 className="text-lg font-medium mb-4">Company</h3>
      <div>
        <Label htmlFor="businessName" className="mb-1 block">Business Name</Label>
        <Input
          id="businessName"
          value={company.businessName}
          onChange={(e) => onUpdate("businessName", e.target.value)}
          placeholder="e.g., Acme Corp"
        />
      </div>
      <div>
        <Label htmlFor="tagline" className="mb-1 block">Tagline (Optional)</Label>
        <Input
          id="tagline"
          value={company.tagline}
          onChange={(e) => onUpdate("tagline", e.target.value)}
          placeholder="e.g., Innovating the Future"
        />
      </div>
      <div>
        <Label htmlFor="logoUrl" className="mb-1 block">Logo URL (Placeholder)</Label>
        <Input
          id="logoUrl"
          value={company.logoUrl}
          onChange={(e) => onUpdate("logoUrl", e.target.value)}
          placeholder="e.g., https://yourcompany.com/logo.png"
        />
        <p className="text-sm text-muted-foreground mt-1">
          (Actual image upload will be implemented later)
        </p>
      </div>
      {/* Brand color pickers will be added here later */}
    </div>
  );
};