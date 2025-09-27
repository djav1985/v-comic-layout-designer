"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignatureData } from "../SignatureDesigner";

interface MediaFormProps {
  media: SignatureData['media'];
  onUpdate: (field: keyof SignatureData['media'], value: any) => void;
  onValidationChange: (formName: string, isValid: boolean) => void;
}

export const MediaForm: React.FC<MediaFormProps> = ({ media, onUpdate, onValidationChange }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    validateForm();
  }, [media]); // Re-validate when media data changes

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i; // Basic URL format regex

    if (media.showHeadshot) {
      if (!media.headshotUrl.trim()) {
        newErrors.headshotUrl = "Headshot URL is required when headshot is shown.";
      } else if (!urlRegex.test(media.headshotUrl)) {
        newErrors.headshotUrl = "Invalid URL format.";
      }
    }
    if (media.showBanner) {
      if (!media.bannerUrl.trim()) {
        newErrors.bannerUrl = "Banner URL is required when banner is shown.";
      } else if (!urlRegex.test(media.bannerUrl)) {
        newErrors.bannerUrl = "Invalid URL format.";
      }
    }
    setErrors(newErrors);
    onValidationChange("MediaForm", Object.keys(newErrors).length === 0);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof SignatureData['media'], value: any) => {
    onUpdate(field, value);
  };

  return (
    <div className="space-y-4 mb-6 p-4 border border-border rounded-lg shadow-lg bg-card transition-all duration-200 hover:shadow-xl">
      <h3 className="text-lg font-semibold mb-4 text-primary-foreground">Media</h3>

      {/* Headshot Section */}
      <div className="flex items-center justify-between">
        <Label htmlFor="showHeadshot" className="text-muted-foreground">Show Headshot</Label>
        <Switch
          id="showHeadshot"
          checked={media.showHeadshot}
          onCheckedChange={(checked) => handleChange("showHeadshot", checked)}
          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
        />
      </div>
      {media.showHeadshot && (
        <div className="space-y-4 pl-4 border-l border-border ml-2 pt-4">
          <div>
            <Label htmlFor="headshotUrl" className="mb-1 block text-muted-foreground">Headshot URL</Label>
            <Input
              id="headshotUrl"
              value={media.headshotUrl}
              onChange={(e) => handleChange("headshotUrl", e.target.value)}
              placeholder="e.g., https://yourcompany.com/headshot.jpg"
              className="w-full bg-input text-foreground border-input focus:ring-ring focus:border-primary"
            />
            {errors.headshotUrl && <p className="text-destructive text-sm mt-1">{errors.headshotUrl}</p>}
          </div>
          <div>
            <Label htmlFor="headshotShape" className="mb-1 block text-muted-foreground">Headshot Shape</Label>
            <Select
              value={media.headshotShape}
              onValueChange={(value: SignatureData['media']['headshotShape']) => handleChange("headshotShape", value)}
            >
              <SelectTrigger id="headshotShape" className="w-full bg-input text-foreground border-input focus:ring-ring focus:border-primary">
                <SelectValue placeholder="Select shape" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="rounded">Rounded Square</SelectItem>
                <SelectItem value="square">Square</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="headshotSize" className="mb-1 block text-muted-foreground">Headshot Size</Label>
            <Select
              value={media.headshotSize}
              onValueChange={(value: SignatureData['media']['headshotSize']) => handleChange("headshotSize", value)}
            >
              <SelectTrigger id="headshotSize" className="w-full bg-input text-foreground border-input focus:ring-ring focus:border-primary">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                <SelectItem value="small">Small (60px)</SelectItem>
                <SelectItem value="medium">Medium (80px)</SelectItem>
                <SelectItem value="large">Large (100px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Banner Section */}
      <div className="flex items-center justify-between mt-6">
        <Label htmlFor="showBanner" className="text-muted-foreground">Show Banner Image</Label>
        <Switch
          id="showBanner"
          checked={media.showBanner}
          onCheckedChange={(checked) => handleChange("showBanner", checked)}
          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
        />
      </div>
      {media.showBanner && (
        <div className="space-y-4 pl-4 border-l border-border ml-2 pt-4">
          <div>
            <Label htmlFor="bannerUrl" className="mb-1 block text-muted-foreground">Banner Image URL</Label>
            <Input
              id="bannerUrl"
              value={media.bannerUrl}
              onChange={(e) => handleChange("bannerUrl", e.target.value)}
              placeholder="e.g., https://yourcompany.com/banner.jpg"
              className="w-full bg-input text-foreground border-input focus:ring-ring focus:border-primary"
            />
            {errors.bannerUrl && <p className="text-destructive text-sm mt-1">{errors.bannerUrl}</p>}
          </div>
        </div>
      )}
    </div>
  );
};