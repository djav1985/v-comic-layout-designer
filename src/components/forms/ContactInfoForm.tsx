"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SignatureData } from "../SignatureDesigner";

interface ContactInfoFormProps {
  contact: SignatureData['contact'];
  onUpdate: (field: keyof SignatureData['contact'], value: string) => void;
  onValidationChange: (formName: string, isValid: boolean) => void;
}

export const ContactInfoForm: React.FC<ContactInfoFormProps> = ({ contact, onUpdate, onValidationChange }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    validateForm();
  }, [contact]); // Re-validate when contact data changes

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!contact.emailAddress.trim()) {
      newErrors.emailAddress = "Email Address is required.";
    } else if (!/\S+@\S+\.\S+/.test(contact.emailAddress)) {
      newErrors.emailAddress = "Invalid email address format.";
    }
    setErrors(newErrors);
    onValidationChange("ContactInfoForm", Object.keys(newErrors).length === 0);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof SignatureData['contact'], value: string) => {
    onUpdate(field, value);
  };

  return (
    <div className="space-y-4 mb-6 p-4 border border-border rounded-lg shadow-sm bg-card">
      <h3 className="text-lg font-medium mb-4 text-primary-foreground">Contact Information</h3>
      <div>
        <Label htmlFor="phoneNumbers" className="mb-1 block text-muted-foreground">Phone Numbers</Label>
        <Input
          id="phoneNumbers"
          value={contact.phoneNumbers}
          onChange={(e) => handleChange("phoneNumbers", e.target.value)}
          placeholder="e.g., +1 (555) 123-4567"
          className="w-full"
        />
      </div>
      <div>
        <Label htmlFor="emailAddress" className="mb-1 block text-muted-foreground">Email Address</Label>
        <Input
          id="emailAddress"
          type="email"
          value={contact.emailAddress}
          onChange={(e) => handleChange("emailAddress", e.target.value)}
          placeholder="e.g., jane.doe@example.com"
          className="w-full"
        />
        {errors.emailAddress && <p className="text-destructive text-sm mt-1">{errors.emailAddress}</p>}
      </div>
      <div>
        <Label htmlFor="websiteLink" className="mb-1 block text-muted-foreground">Website Link</Label>
        <Input
          id="websiteLink"
          type="url"
          value={contact.websiteLink}
          onChange={(e) => handleChange("websiteLink", e.target.value)}
          placeholder="e.g., https://www.yourcompany.com"
          className="w-full"
        />
      </div>
      <div>
        <Label htmlFor="officeAddress" className="mb-1 block text-muted-foreground">Physical Office Address</Label>
        <Input
          id="officeAddress"
          value={contact.officeAddress}
          onChange={(e) => handleChange("officeAddress", e.target.value)}
          placeholder="e.g., 123 Main St, Anytown, USA"
          className="w-full"
        />
      </div>
      <div>
        <Label htmlFor="bookingLink" className="mb-1 block text-muted-foreground">Booking Link (Optional)</Label>
        <Input
          id="bookingLink"
          type="url"
          value={contact.bookingLink}
          onChange={(e) => handleChange("bookingLink", e.target.value)}
          placeholder="e.g., https://calendly.com/janedoe"
          className="w-full"
        />
      </div>
    </div>
  );
};