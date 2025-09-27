"use client";

import React, { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignaturePreview } from "./SignaturePreview";
import { IdentityForm } from "./forms/IdentityForm";
import { CompanyForm } from "./forms/CompanyForm";
import { ContactInfoForm } from "./forms/ContactInfoForm";
import { SocialMediaForm } from "./forms/SocialMediaForm";

// Define a type for the signature data
export type SignatureData = {
  template: string;
  identity: {
    fullName: string;
    jobTitle: string;
    pronouns: string;
    department: string;
  };
  company: {
    businessName: string;
    tagline: string;
    logoUrl: string;
    brandColorPrimary: string;
    brandColorAccent: string;
    brandColorText: string;
  };
  contact: {
    phoneNumbers: string;
    emailAddress: string;
    websiteLink: string;
    officeAddress: string;
    bookingLink: string;
  };
  socialMedia: {
    id: string;
    platform: string;
    url: string;
  }[];
  // Add other sections as we implement them
};

const SignatureDesigner = () => {
  const [signatureData, setSignatureData] = useState<SignatureData>({
    template: "classic-two-column",
    identity: {
      fullName: "John Doe",
      jobTitle: "Software Engineer",
      pronouns: "he/him",
      department: "Engineering",
    },
    company: {
      businessName: "Acme Corp",
      tagline: "Innovating the Future",
      logoUrl: "https://via.placeholder.com/100x50?text=Logo",
      brandColorPrimary: "#1a73e8",
      brandColorAccent: "#4285f4",
      brandColorText: "#333333",
    },
    contact: {
      phoneNumbers: "+1 (555) 123-4567",
      emailAddress: "john.doe@example.com",
      websiteLink: "https://www.example.com",
      officeAddress: "123 Main St, Anytown, USA",
      bookingLink: "",
    },
    socialMedia: [
      { id: "1", platform: "LinkedIn", url: "https://linkedin.com/in/johndoe" },
      { id: "2", platform: "X", url: "https://x.com/johndoe" },
    ],
  });

  const handleIdentityChange = (field: keyof SignatureData['identity'], value: string) => {
    setSignatureData(prevData => ({
      ...prevData,
      identity: {
        ...prevData.identity,
        [field]: value,
      },
    }));
  };

  const handleCompanyChange = (field: keyof SignatureData['company'], value: string) => {
    setSignatureData(prevData => ({
      ...prevData,
      company: {
        ...prevData.company,
        [field]: value,
      },
    }));
  };

  const handleContactChange = (field: keyof SignatureData['contact'], value: string) => {
    setSignatureData(prevData => ({
      ...prevData,
      contact: {
        ...prevData.contact,
        [field]: value,
      },
    }));
  };

  const handleSocialMediaChange = (socialMedia: SignatureData['socialMedia']) => {
    setSignatureData(prevData => ({
      ...prevData,
      socialMedia,
    }));
  };

  const handleTemplateChange = (value: string) => {
    setSignatureData(prevData => ({
      ...prevData,
      template: value,
    }));
  };

  return (
    <div className="h-screen flex flex-col">
      <h1 className="text-3xl font-bold p-4 border-b">Email Signature Designer</h1>
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-grow"
      >
        <ResizablePanel defaultSize={50} minSize={30}>
          <ScrollArea className="h-full p-6">
            <h2 className="text-2xl font-semibold mb-6">Design Controls</h2>

            {/* Template Selection */}
            <div className="mb-6">
              <Label htmlFor="template-select" className="mb-2 block">Select Template</Label>
              <Select onValueChange={handleTemplateChange} defaultValue={signatureData.template}>
                <SelectTrigger id="template-select">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic-two-column">Classic Two-Column</SelectItem>
                  <SelectItem value="compact-single-column">Compact Single-Column</SelectItem>
                  <SelectItem value="corporate-strip">Corporate Strip</SelectItem>
                  <SelectItem value="card-with-cta">Card with Call-to-Action</SelectItem>
                  <SelectItem value="social-focused">Social-Focused Design</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Identity Section */}
            <IdentityForm
              identity={signatureData.identity}
              onUpdate={handleIdentityChange}
            />

            {/* Company Section */}
            <CompanyForm
              company={signatureData.company}
              onUpdate={handleCompanyChange}
            />

            {/* Contact Info Section */}
            <ContactInfoForm
              contact={signatureData.contact}
              onUpdate={handleContactChange}
            />

            {/* Social Media Section */}
            <SocialMediaForm
              socialMedia={signatureData.socialMedia}
              onUpdate={handleSocialMediaChange}
            />

            {/* Other sections will go here */}
            <div className="mt-8 p-4 border rounded-md bg-muted/20 text-muted-foreground">
              More design controls and sections will be added here!
            </div>
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col p-6 bg-gray-50 dark:bg-gray-900">
            <h2 className="text-2xl font-semibold mb-4">Live Preview</h2>
            <Tabs defaultValue="desktop" className="flex-grow flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="desktop">Desktop</TabsTrigger>
                <TabsTrigger value="mobile">Mobile</TabsTrigger>
              </TabsList>
              <TabsContent value="desktop" className="flex-grow flex flex-col data-[state=inactive]:hidden">
                <SignaturePreview signatureData={signatureData} previewMode="desktop" />
              </TabsContent>
              <TabsContent value="mobile" className="flex-grow flex flex-col data-[state=inactive]:hidden">
                <SignaturePreview signatureData={signatureData} previewMode="mobile" />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default SignatureDesigner;