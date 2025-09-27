"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SignatureData } from "../SignatureDesigner";

interface IdentityFormProps {
  identity: SignatureData['identity'];
  onUpdate: (field: keyof SignatureData['identity'], value: string) => void;
}

export const IdentityForm: React.FC<IdentityFormProps> = ({ identity, onUpdate }) => {
  return (
    <div className="space-y-4 mb-6 p-4 border border-border rounded-lg shadow-sm bg-card">
      <h3 className="text-lg font-medium mb-4 text-primary-foreground">Identity</h3>
      <div>
        <Label htmlFor="fullName" className="mb-1 block text-muted-foreground">Full Name</Label>
        <Input
          id="fullName"
          value={identity.fullName}
          onChange={(e) => onUpdate("fullName", e.target.value)}
          placeholder="e.g., Jane Doe"
          className="w-full"
        />
      </div>
      <div>
        <Label htmlFor="jobTitle" className="mb-1 block text-muted-foreground">Job Title</Label>
        <Input
          id="jobTitle"
          value={identity.jobTitle}
          onChange={(e) => onUpdate("jobTitle", e.target.value)}
          placeholder="e.g., Senior Developer"
          className="w-full"
        />
      </div>
      <div>
        <Label htmlFor="pronouns" className="mb-1 block text-muted-foreground">Pronouns (Optional)</Label>
        <Input
          id="pronouns"
          value={identity.pronouns}
          onChange={(e) => onUpdate("pronouns", e.target.value)}
          placeholder="e.g., she/her"
          className="w-full"
        />
      </div>
      <div>
        <Label htmlFor="department" className="mb-1 block text-muted-foreground">Department (Optional)</Label>
        <Input
          id="department"
          value={identity.department}
          onChange={(e) => onUpdate("department", e.target.value)}
          placeholder="e.g., Marketing"
          className="w-full"
        />
      </div>
    </div>
  );
};