"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignatureData } from "../SignatureDesigner";

interface CallToActionFormProps {
  cta: SignatureData['cta'];
  onUpdate: (field: keyof SignatureData['cta'], value: any) => void;
  brandColorPrimary: string;
  brandColorText: string;
  onValidationChange: (formName: string, isValid: boolean) => void;
}

export const CallToActionForm: React.FC<CallToActionFormProps> = ({ cta, onUpdate, brandColorPrimary, brandColorText, onValidationChange }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    validateForm();
  }, [cta]); // Re-validate when cta data changes

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (cta.showCta) {
      if (!cta.ctaLabel.trim()) {
        newErrors.ctaLabel = "Button Label is required when CTA is shown.";
      }
      if (!cta.ctaLink.trim()) {
        newErrors.ctaLink = "Button Link is required when CTA is shown.";
      }
    }
    setErrors(newErrors);
    onValidationChange("CallToActionForm", Object.keys(newErrors).length === 0);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof SignatureData['cta'], value: any) => {
    onUpdate(field, value);
  };

  return (
    <div className="space-y-4 mb-6 p-4 border border-border rounded-lg shadow-xl bg-card transition-all duration-200 hover:shadow-2xl hover:translate-y-[-2px]">
      <h3 className="text-lg font-semibold mb-4 text-primary-foreground">Call-to-Action Button</h3>

      <div className="flex items-center justify-between">
        <Label htmlFor="showCta" className="text-muted-foreground">Show Call-to-Action Button</Label>
        <Switch
          id="showCta"
          checked={cta.showCta}
          onCheckedChange={(checked) => handleChange("showCta", checked)}
          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
        />
      </div>

      {cta.showCta && (
        <div className="space-y-4 pl-4 border-l border-border ml-2 pt-4">
          <div>
            <Label htmlFor="ctaLabel" className="mb-1 block text-muted-foreground">Button Label</Label>
            <Input
              id="ctaLabel"
              value={cta.ctaLabel}
              onChange={(e) => handleChange("ctaLabel", e.target.value)}
              placeholder="e.g., Learn More"
              className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200"
            />
            {errors.ctaLabel && <p className="text-destructive text-sm mt-1">{errors.ctaLabel}</p>}
          </div>
          <div>
            <Label htmlFor="ctaLink" className="mb-1 block text-muted-foreground">Button Link</Label>
            <Input
              id="ctaLink"
              type="url"
              value={cta.ctaLink}
              onChange={(e) => handleChange("ctaLink", e.target.value)}
              placeholder="e.g., https://www.yourcompany.com/learn"
              className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200"
            />
            {errors.ctaLink && <p className="text-destructive text-sm mt-1">{errors.ctaLink}</p>}
          </div>
          <div>
            <Label htmlFor="ctaStyle" className="mb-1 block text-muted-foreground">Button Style</Label>
            <Select
              value={cta.ctaStyle}
              onValueChange={(value: SignatureData['cta']['ctaStyle']) => handleChange("ctaStyle", value)}
            >
              <SelectTrigger id="ctaStyle" className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border shadow-lg">
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="outlined">Outlined</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="ctaCornerShape" className="mb-1 block text-muted-foreground">Corner Shape</Label>
            <Select
              value={cta.ctaCornerShape}
              onValueChange={(value: SignatureData['cta']['ctaCornerShape']) => handleChange("ctaCornerShape", value)}
            >
              <SelectTrigger id="ctaCornerShape" className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200">
                <SelectValue placeholder="Select shape" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border shadow-lg">
                <SelectItem value="rounded">Rounded</SelectItem>
                <SelectItem value="square">Square</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 p-3 border border-border rounded-md bg-secondary/20">
            <p className="text-sm text-muted-foreground">
              Preview of button colors (using brand primary: <span style={{ color: brandColorPrimary }}>{brandColorPrimary}</span>, text: <span style={{ color: brandColorText }}>{brandColorText}</span>)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};