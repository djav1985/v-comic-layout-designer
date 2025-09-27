"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignatureData } from "../SignatureDesigner";

interface MediaFormProps {
  media: SignatureData['media'];
  onUpdate: (field: keyof SignatureData['media'], value: any) => void;
}

export const MediaForm: React.FC<MediaFormProps> = ({ media, onUpdate }) => {
  return (
    <div className="space-y-4 mb-6 p-4 border rounded-md bg-card">
      <h3 className="text-lg font-medium mb-4">Media</h3>

      {/* Headshot Section */}
      <div className="flex items-center justify-between">
        <Label htmlFor="showHeadshot">Show Headshot</Label>
        <Switch
          id="showHeadshot"
          checked={media.showHeadshot}
          onCheckedChange={(checked) => onUpdate("showHeadshot", checked)}
        />
      </div>
      {media.showHeadshot && (
        <div className="space-y-4 pl-4 border-l ml-2">
          <div>
            <Label htmlFor="headshotUrl" className="mb-1 block">Headshot URL</Label>
            <Input
              id="headshotUrl"
              value={media.headshotUrl}
              onChange={(e) => onUpdate("headshotUrl", e.target.value)}
              placeholder="e.g., https://yourcompany.com/headshot.jpg"
            />
          </div>
          <div>
            <Label htmlFor="headshotShape" className="mb-1 block">Headshot Shape</Label>
            <Select
              value={media.headshotShape}
              onValueChange={(value: SignatureData['media']['headshotShape']) => onUpdate("headshotShape", value)}
            >
              <SelectTrigger id="headshotShape">
                <SelectValue placeholder="Select shape" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="rounded">Rounded Square</SelectItem>
                <SelectItem value="square">Square</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="headshotSize" className="mb-1 block">Headshot Size</Label>
            <Select
              value={media.headshotSize}
              onValueChange={(value: SignatureData['media']['headshotSize']) => onUpdate("headshotSize", value)}
            >
              <SelectTrigger id="headshotSize">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
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
        <Label htmlFor="showBanner">Show Banner Image</Label>
        <Switch
          id="showBanner"
          checked={media.showBanner}
          onCheckedChange={(checked) => onUpdate("showBanner", checked)}
        />
      </div>
      {media.showBanner && (
        <div className="space-y-4 pl-4 border-l ml-2">
          <div>
            <Label htmlFor="bannerUrl" className="mb-1 block">Banner Image URL</Label>
            <Input
              id="bannerUrl"
              value={media.bannerUrl}
              onChange={(e) => onUpdate("bannerUrl", e.target.value)}
              placeholder="e.g., https://yourcompany.com/banner.jpg"
            />
          </div>
        </div>
      )}
    </div>
  );
};