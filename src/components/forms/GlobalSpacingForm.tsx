"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignatureData } from "../SignatureDesigner";

interface GlobalSpacingFormProps {
  spacing: SignatureData['spacing'];
  onUpdate: (spacing: SignatureData['spacing']) => void;
  onValidationChange: (formName: string, isValid: boolean) => void;
}

export const GlobalSpacingForm: React.FC<GlobalSpacingFormProps> = ({ spacing, onUpdate, onValidationChange }) => {
  // No specific validation for spacing, but we still need to report validity
  useEffect(() => {
    onValidationChange("GlobalSpacingForm", true); // Always valid
  }, [spacing, onValidationChange]);

  return (
    <div className="space-y-4 mb-6 p-4 border border-border rounded-lg shadow-xl bg-card transition-all duration-200 hover:shadow-2xl hover:translate-y-[-2px]">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Global Spacing</h3>
      <div>
        <Label htmlFor="spacing" className="mb-1 block text-muted-foreground">Density</Label>
        <Select
          value={spacing}
          onValueChange={(value: SignatureData['spacing']) => onUpdate(value)}
        >
          <SelectTrigger id="spacing" className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200 hover:border-primary">
            <SelectValue placeholder="Select spacing" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border shadow-lg">
            <SelectItem value="tight">Tight</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="roomy">Roomy</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};