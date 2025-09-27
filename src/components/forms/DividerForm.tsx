"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SignatureData } from "../SignatureDesigner";

interface DividerFormProps {
  divider: SignatureData['divider'];
  onUpdate: (field: keyof SignatureData['divider'], value: any) => void;
  onValidationChange: (formName: string, isValid: boolean) => void;
}

export const DividerForm: React.FC<DividerFormProps> = ({ divider, onUpdate, onValidationChange }) => {
  // No specific validation for divider fields, but we still need to report validity
  useEffect(() => {
    onValidationChange("DividerForm", true); // Always valid for now
  }, [divider, onValidationChange]);

  return (
    <div className="space-y-4 mb-6 p-4 border border-border rounded-lg shadow-lg bg-card transition-all duration-200 hover:shadow-xl">
      <h3 className="text-lg font-semibold mb-4 text-primary-foreground">Divider</h3>

      <div className="flex items-center justify-between">
        <Label htmlFor="showDivider" className="text-muted-foreground">Show Divider Line</Label>
        <Switch
          id="showDivider"
          checked={divider.showDivider}
          onCheckedChange={(checked) => onUpdate("showDivider", checked)}
          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
        />
      </div>

      {divider.showDivider && (
        <div className="space-y-4 pl-4 border-l border-border ml-2 pt-4">
          <div>
            <Label htmlFor="dividerThickness" className="mb-1 block text-muted-foreground">Thickness (px)</Label>
            <Input
              id="dividerThickness"
              type="number"
              value={divider.thickness}
              onChange={(e) => onUpdate("thickness", parseInt(e.target.value) || 0)}
              min={1}
              max={10}
              step={1}
              className="w-full bg-input text-foreground border-input focus:ring-ring focus:border-primary"
            />
          </div>
          <div>
            <Label htmlFor="dividerColor" className="mb-1 block text-muted-foreground">Color</Label>
            <Input
              id="dividerColor"
              type="color"
              value={divider.color}
              onChange={(e) => onUpdate("color", e.target.value)}
              className="h-10 w-full p-1 cursor-pointer rounded-md border border-input focus:ring-ring focus:border-primary"
            />
          </div>
        </div>
      )}
    </div>
  );
};