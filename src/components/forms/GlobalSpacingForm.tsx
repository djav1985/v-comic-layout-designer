"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignatureData } from "../SignatureDesigner";

interface GlobalSpacingFormProps {
  spacing: SignatureData['spacing'];
  onUpdate: (spacing: SignatureData['spacing']) => void;
}

export const GlobalSpacingForm: React.FC<GlobalSpacingFormProps> = ({ spacing, onUpdate }) => {
  return (
    <div className="space-y-4 mb-6 p-4 border border-border rounded-lg shadow-sm bg-card">
      <h3 className="text-lg font-medium mb-4 text-primary-foreground">Global Spacing</h3>
      <div>
        <Label htmlFor="spacing" className="mb-1 block text-muted-foreground">Density</Label>
        <Select
          value={spacing}
          onValueChange={(value: SignatureData['spacing']) => onUpdate(value)}
        >
          <SelectTrigger id="spacing" className="w-full">
            <SelectValue placeholder="Select spacing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tight">Tight</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="roomy">Roomy</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};