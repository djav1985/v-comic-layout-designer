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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="brandColorPrimary" className="mb-1 block">Primary Brand Color</Label>
          <Input
            id="brandColorPrimary"
            type="color"
            value={company.brandColorPrimary}
            onChange={(e) => onUpdate("brandColorPrimary", e.target.value)}
            className="h-10 w-full p-1"
          />
        </div>
        <div>
          <Label htmlFor="brandColorAccent" className="mb-1 block">Accent Brand Color</Label>
          <Input
            id="brandColorAccent"
            type="color"
            value={company.brandColorAccent}
            onChange={(e) => onUpdate("brandColorAccent", e.target.value)}
            className="h-10 w-full p-1"
          />
        </div>
        <div>
          <Label htmlFor="brandColorText" className="mb-1 block">Text Color</Label>
          <Input
            id="brandColorText"
            type="color"
            value={company.brandColorText}
            onChange={(e) => onUpdate("brandColorText", e.target.value)}
            className="h-10 w-full p-1"
          />
        </div>
      </div>
    </div>
  );
};