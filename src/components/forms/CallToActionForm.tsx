"use client";

import React from "react";
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
}

export const CallToActionForm: React.FC<CallToActionFormProps> = ({ cta, onUpdate, brandColorPrimary, brandColorText }) => {
  return (
    <div className="space-y-4 mb-6 p-4 border border-border rounded-lg shadow-sm bg-card">
      <h3 className="text-lg font-medium mb-4 text-primary-foreground">Call-to-Action Button</h3>

      <div className="flex items-center justify-between">
        <Label htmlFor="showCta" className="text-muted-foreground">Show Call-to-Action Button</Label>
        <Switch
          id="showCta"
          checked={cta.showCta}
          onCheckedChange={(checked) => onUpdate("showCta", checked)}
        />
      </div>

      {cta.showCta && (
        <div className="space-y-4 pl-4 border-l border-border ml-2 pt-4">
          <div>
            <Label htmlFor="ctaLabel" className="mb-1 block text-muted-foreground">Button Label</Label>
            <Input
              id="ctaLabel"
              value={cta.ctaLabel}
              onChange={(e) => onUpdate("ctaLabel", e.target.value)}
              placeholder="e.g., Learn More"
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="ctaLink" className="mb-1 block text-muted-foreground">Button Link</Label>
            <Input
              id="ctaLink"
              type="url"
              value={cta.ctaLink}
              onChange={(e) => onUpdate("ctaLink", e.target.value)}
              placeholder="e.g., https://www.yourcompany.com/learn"
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="ctaStyle" className="mb-1 block text-muted-foreground">Button Style</Label>
            <Select
              value={cta.ctaStyle}
              onValueChange={(value: SignatureData['cta']['ctaStyle']) => onUpdate("ctaStyle", value)}
            >
              <SelectTrigger id="ctaStyle" className="w-full">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="outlined">Outlined</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="ctaCornerShape" className="mb-1 block text-muted-foreground">Corner Shape</Label>
            <Select
              value={cta.ctaCornerShape}
              onValueChange={(value: SignatureData['cta']['ctaCornerShape']) => onUpdate("ctaCornerShape", value)}
            >
              <SelectTrigger id="ctaCornerShape" className="w-full">
                <SelectValue placeholder="Select shape" />
              </SelectTrigger>
              <SelectContent>
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