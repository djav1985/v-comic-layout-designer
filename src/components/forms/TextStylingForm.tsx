"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignatureData } from "../SignatureDesigner";

interface TextStylingFormProps {
  textStyling: SignatureData['textStyling'];
  onUpdate: (field: keyof SignatureData['textStyling'], value: any) => void;
  onValidationChange: (formName: string, isValid: boolean) => void;
}

const emailSafeFonts = [
  "Arial, sans-serif",
  "Verdana, sans-serif",
  "Helvetica, sans-serif",
  "Tahoma, sans-serif",
  "Trebuchet MS, sans-serif",
  "Georgia, serif",
  "Times New Roman, serif",
  "Courier New, monospace",
];

export const TextStylingForm: React.FC<TextStylingFormProps> = ({ textStyling, onUpdate, onValidationChange }) => {
  // No specific validation for text styling, but we still need to report validity
  useEffect(() => {
    onValidationChange("TextStylingForm", true); // Always valid
  }, [textStyling, onValidationChange]);

  return (
    <div className="space-y-4 mb-6 p-4 border border-border rounded-lg shadow-xl bg-card transition-all duration-200 hover:shadow-2xl hover:translate-y-[-2px]">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Text & Font Styling</h3>
      <div>
        <Label htmlFor="fontFamily" className="mb-1 block text-muted-foreground">Font Family</Label>
        <Select
          value={textStyling.fontFamily}
          onValueChange={(value) => onUpdate("fontFamily", value)}
        >
          <SelectTrigger id="fontFamily" className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200 hover:border-primary">
            <SelectValue placeholder="Select a font" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border shadow-lg">
            {emailSafeFonts.map(font => (
              <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                {font.split(',')[0]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="baseFontSize" className="mb-1 block text-muted-foreground">Base Font Size (px)</Label>
        <Input
          id="baseFontSize"
          type="number"
          value={textStyling.baseFontSize}
          onChange={(e) => onUpdate("baseFontSize", parseInt(e.target.value) || 0)}
          min={8}
          max={24}
          step={1}
          className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200 hover:border-primary"
        />
      </div>
      <div>
        <Label htmlFor="baseLineHeight" className="mb-1 block text-muted-foreground">Base Line Height</Label>
        <Input
          id="baseLineHeight"
          type="number"
          value={textStyling.baseLineHeight}
          onChange={(e) => onUpdate("baseLineHeight", parseFloat(e.target.value) || 0)}
          min={1.0}
          max={2.0}
          step={0.1}
          className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200 hover:border-primary"
        />
      </div>
    </div>
  );
};