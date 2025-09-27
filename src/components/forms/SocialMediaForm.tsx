"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignatureData } from "../SignatureDesigner";
import { PlusCircle, XCircle, Linkedin, X, Facebook, Instagram, Youtube, Globe, Github, Share2 } from "lucide-react";

interface SocialMediaFormProps {
  socialMedia: SignatureData['socialMedia'];
  onUpdate: (socialMedia: SignatureData['socialMedia']) => void;
  socialIconShape: SignatureData['media']['socialIconShape'];
  onUpdateSocialIconShape: (shape: SignatureData['media']['socialIconShape']) => void;
}

const socialPlatforms = [
  { name: "LinkedIn", icon: Linkedin },
  { name: "X", icon: X },
  { name: "Facebook", icon: Facebook },
  { name: "Instagram", icon: Instagram },
  { name: "YouTube", icon: Youtube },
  { name: "Website", icon: Globe },
  { name: "GitHub", icon: Github },
  { name: "Other", icon: Share2 }, // Generic icon for other platforms
];

export const SocialMediaForm: React.FC<SocialMediaFormProps> = ({ socialMedia, onUpdate, socialIconShape, onUpdateSocialIconShape }) => {
  const handleAddSocial = () => {
    if (socialMedia.length < 10) {
      onUpdate([...socialMedia, { id: String(Date.now()), platform: "LinkedIn", url: "" }]);
    }
  };

  const handleRemoveSocial = (id: string) => {
    onUpdate(socialMedia.filter(item => item.id !== id));
  };

  const handleSocialPlatformChange = (id: string, platform: string) => {
    onUpdate(socialMedia.map(item => item.id === id ? { ...item, platform } : item));
  };

  const handleSocialUrlChange = (id: string, url: string) => {
    onUpdate(socialMedia.map(item => item.id === id ? { ...item, url } : item));
  };

  return (
    <div className="space-y-4 mb-6 p-4 border border-border rounded-lg shadow-sm bg-card">
      <h3 className="text-lg font-medium mb-4 text-primary-foreground">Social Media (Up to 10)</h3>

      <div className="mb-4">
        <Label htmlFor="socialIconShape" className="mb-1 block text-muted-foreground">Icon Shape</Label>
        <Select
          value={socialIconShape}
          onValueChange={(value: SignatureData['media']['socialIconShape']) => onUpdateSocialIconShape(value)}
        >
          <SelectTrigger id="socialIconShape" className="w-full">
            <SelectValue placeholder="Select icon shape" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="circle">Circle</SelectItem>
            <SelectItem value="square">Square</SelectItem>
            <SelectItem value="ghost">Ghost (No Background)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {socialMedia.map((item) => {
        const IconComponent = socialPlatforms.find(p => p.name === item.platform)?.icon || Share2;
        return (
          <div key={item.id} className="flex items-end space-x-2 mb-4 p-2 border border-border rounded-md bg-secondary/20">
            <div className="flex-grow grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor={`platform-${item.id}`} className="mb-1 block text-muted-foreground">Platform</Label>
                <Select
                  value={item.platform}
                  onValueChange={(value) => handleSocialPlatformChange(item.id, value)}
                >
                  <SelectTrigger id={`platform-${item.id}`} className="w-full">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {socialPlatforms.map(platform => (
                      <SelectItem key={platform.name} value={platform.name}>
                        <div className="flex items-center">
                          <platform.icon className="mr-2 h-4 w-4" />
                          {platform.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`url-${item.id}`} className="mb-1 block text-muted-foreground">URL</Label>
                <Input
                  id={`url-${item.id}`}
                  type="url"
                  value={item.url}
                  onChange={(e) => handleSocialUrlChange(item.id, e.target.value)}
                  placeholder={`https://${item.platform.toLowerCase()}.com/yourprofile`}
                  className="w-full"
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveSocial(item.id)}
              className="text-destructive hover:text-destructive/80"
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        );
      })}
      {socialMedia.length < 10 && (
        <Button variant="outline" onClick={handleAddSocial} className="w-full mt-4">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Social Link
        </Button>
      )}
    </div>
  );
};