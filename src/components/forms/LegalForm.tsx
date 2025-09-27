"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SignatureData } from "../SignatureDesigner";

interface LegalFormProps {
  legal: SignatureData['legal'];
  onUpdate: (field: keyof SignatureData['legal'], value: any) => void;
  onValidationChange: (formName: string, isValid: boolean) => void;
}

export const LegalForm: React.FC<LegalFormProps> = ({ legal, onUpdate, onValidationChange }) => {
  // No specific validation for legal fields, but we still need to report validity
  useEffect(() => {
    onValidationChange("LegalForm", true); // Always valid for now
  }, [legal, onValidationChange]);

  return (
    <div className="space-y-4 mb-6 p-4 border border-border rounded-lg shadow-xl bg-card transition-all duration-200 hover:shadow-2xl hover:translate-y-[-2px]">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Legal & Compliance</h3>
      <div>
        <Label htmlFor="disclaimerText" className="mb-1 block text-muted-foreground">Disclaimer Text (Optional)</Label>
        <Textarea
          id="disclaimerText"
          value={legal.disclaimerText}
          onChange={(e) => onUpdate("disclaimerText", e.target.value)}
          placeholder="e.g., This email is confidential..."
          rows={4}
          className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200 hover:border-primary"
        />
      </div>
      <div>
        <Label htmlFor="confidentialityNotice" className="mb-1 block text-muted-foreground">Confidentiality Notice (Optional)</Label>
        <Textarea
          id="confidentialityNotice"
          value={legal.confidentialityNotice}
          onChange={(e) => onUpdate("confidentialityNotice", e.target.value)}
          placeholder="e.g., If you have received this email in error..."
          rows={3}
          className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200 hover:border-primary"
        />
      </div>
      <div className="flex items-center justify-between mt-4">
        <Label htmlFor="showEqualHousingBadge" className="text-muted-foreground">Show Equal Housing Badge</Label>
        <Switch
          id="showEqualHousingBadge"
          checked={legal.showEqualHousingBadge}
          onCheckedChange={(checked) => onUpdate("showEqualHousingBadge", checked)}
          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="showHipaaBadge" className="text-muted-foreground">Show HIPAA Compliance Badge</Label>
        <Switch
          id="showHipaaBadge"
          checked={legal.showHipaaBadge}
          onCheckedChange={(checked) => onUpdate("showHipaaBadge", checked)}
          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
        />
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        (Compliance badge images will be placeholders for now)
      </p>
    </div>
  );
};