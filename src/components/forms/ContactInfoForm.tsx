"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SignatureData } from "../SignatureDesigner";

interface ContactInfoFormProps {
  contact: SignatureData['contact'];
  onUpdate: (field: keyof SignatureData['contact'], value: string) => void;
}

export const ContactInfoForm: React.FC<ContactInfoFormProps> = ({ contact, onUpdate }) => {
  return (
    <div className="space-y-4 mb-6 p-4 border rounded-md bg-card">
      <h3 className="text-lg font-medium mb-4">Contact Information</h3>
      <div>
        <Label htmlFor="phoneNumbers" className="mb-1 block">Phone Numbers</Label>
        <Input
          id="phoneNumbers"
          value={contact.phoneNumbers}
          onChange={(e) => onUpdate("phoneNumbers", e.target.value)}
          placeholder="e.g., +1 (555) 123-4567"
        />
      </div>
      <div>
        <Label htmlFor="emailAddress" className="mb-1 block">Email Address</Label>
        <Input
          id="emailAddress"
          type="email"
          value={contact.emailAddress}
          onChange={(e) => onUpdate("emailAddress", e.target.value)}
          placeholder="e.g., jane.doe@example.com"
        />
      </div>
      <div>
        <Label htmlFor="websiteLink" className="mb-1 block">Website Link</Label>
        <Input
          id="websiteLink"
          type="url"
          value={contact.websiteLink}
          onChange={(e) => onUpdate("websiteLink", e.target.value)}
          placeholder="e.g., https://www.yourcompany.com"
        />
      </div>
      <div>
        <Label htmlFor="officeAddress" className="mb-1 block">Physical Office Address</Label>
        <Input
          id="officeAddress"
          value={contact.officeAddress}
          onChange={(e) => onUpdate("officeAddress", e.target.value)}
          placeholder="e.g., 123 Main St, Anytown, USA"
        />
      </div>
      <div>
        <Label htmlFor="bookingLink" className="mb-1 block">Booking Link (Optional)</Label>
        <Input
          id="bookingLink"
          type="url"
          value={contact.bookingLink}
          onChange={(e) => onUpdate("bookingLink", e.target.value)}
          placeholder="e.g., https://calendly.com/janedoe"
        />
      </div>
    </div>
  );
};