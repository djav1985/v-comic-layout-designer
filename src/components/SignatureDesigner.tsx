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
import { MediaForm } from "./forms/MediaForm";
import { LegalForm } from "./forms/LegalForm";
import { CallToActionForm } from "./forms/CallToActionForm";
import { TextStylingForm } from "./forms/TextStylingForm"; // Import TextStylingForm
import { DividerForm } from "./forms/DividerForm"; // Import DividerForm

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
  media: {
    headshotUrl: string;
    showHeadshot: boolean;
    headshotShape: "circle" | "rounded" | "square";
    headshotSize: "small" | "medium" | "large";
    bannerUrl: string;
    showBanner: boolean;
    socialIconShape: "circle" | "square" | "ghost";
  };
  legal: {
    disclaimerText: string;
    confidentialityNotice: string;
    showEqualHousingBadge: boolean;
    showHipaaBadge: boolean;
  };
  cta: {
    ctaLabel: string;
    ctaLink: string;
    ctaStyle: "filled" | "outlined";
    ctaCornerShape: "rounded" | "square";
    showCta: boolean;
  };
  textStyling: {
    fontFamily: string;
    baseFontSize: number;
    baseLineHeight: number;
  };
  divider: {
    showDivider: boolean;
    thickness: number;
    color: string;
  };
  // Add other sections as we implement them
};

const SignatureDesigner = () => {
  const [signatureData, setSignatureData] = useState<SignatureData>({
    template: "classic-two-column",
    identity: {
      fullName: "Jane Doe",
      jobTitle: "Marketing Manager",
      pronouns: "she/her",
      department: "Marketing",
    },
    company: {
      businessName: "Innovate Solutions",
      tagline: "Driving Tomorrow's Technology",
      logoUrl: "https://via.placeholder.com/120x60/4285F4/FFFFFF?text=YourLogo",
      brandColorPrimary: "#4285F4",
      brandColorAccent: "#34A853",
      brandColorText: "#333333",
    },
    contact: {
      phoneNumbers: "+1 (555) 987-6543",
      emailAddress: "jane.doe@innovatesolutions.com",
      websiteLink: "https://www.innovatesolutions.com",
      officeAddress: "456 Tech Drive, Innovation City, CA 90210",
      bookingLink: "https://calendly.com/janedoe-innovate",
    },
    socialMedia: [
      { id: "1", platform: "LinkedIn", url: "https://linkedin.com/in/janedoe" },
      { id: "2", platform: "X", url: "https://x.com/janedoe" },
      { id: "3", platform: "Facebook", url: "https://facebook.com/janedoe" },
    ],
    media: {
      headshotUrl: "https://via.placeholder.com/100/FFD700/FFFFFF?text=JD",
      showHeadshot: true,
      headshotShape: "circle",
      headshotSize: "medium",
      bannerUrl: "https://via.placeholder.com/600x100/FF6347/FFFFFF?text=PromotionalBanner",
      showBanner: false,
      socialIconShape: "circle",
    },
    legal: {
      disclaimerText: "This message is intended only for the use of the individual or entity to which it is addressed and may contain information that is confidential and privileged.",
      confidentialityNotice: "If you are not the intended recipient, you are hereby notified that any dissemination, distribution, or copying of this communication is strictly prohibited.",
      showEqualHousingBadge: true,
      showHipaaBadge: false,
    },
    cta: {
      ctaLabel: "Explore Our Services",
      ctaLink: "https://www.innovatesolutions.com/services",
      ctaStyle: "filled",
      ctaCornerShape: "rounded",
      showCta: true,
    },
    textStyling: {
      fontFamily: "Arial, sans-serif",
      baseFontSize: 14,
      baseLineHeight: 1.4,
    },
    divider: {
      showDivider: true,
      thickness: 1,
      color: "#cccccc",
    },
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

  const handleMediaChange = (field: keyof SignatureData['media'], value: any) => {
    setSignatureData(prevData => ({
      ...prevData,
      media: {
        ...prevData.media,
        [field]: value,
      },
    }));
  };

  const handleLegalChange = (field: keyof SignatureData['legal'], value: any) => {
    setSignatureData(prevData => ({
      ...prevData,
      legal: {
        ...prevData.legal,
        [field]: value,
      },
    }));
  };

  const handleCtaChange = (field: keyof SignatureData['cta'], value: any) => {
    setSignatureData(prevData => ({
      ...prevData,
      cta: {
        ...prevData.cta,
        [field]: value,
      },
    }));
  };

  const handleTextStylingChange = (field: keyof SignatureData['textStyling'], value: any) => {
    setSignatureData(prevData => ({
      ...prevData,
      textStyling: {
        ...prevData.textStyling,
        [field]: value,
      },
    }));
  };

  const handleDividerChange = (field: keyof SignatureData['divider'], value: any) => {
    setSignatureData(prevData => ({
      ...prevData,
      divider: {
        ...prevData.divider,
        [field]: value,
      },
    }));
  };

  const handleTemplateChange = (value: string) => {
    setSignatureData(prevData => ({
      ...prevData,
      template: value,
    }));
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <h1 className="text-3xl font-bold p-4 border-b border-border shadow-sm">Email Signature Designer</h1>
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-grow"
      >
        <ResizablePanel defaultSize={50} minSize={30}>
          <ScrollArea className="h-full p-6">
            <h2 className="text-2xl font-semibold mb-6 text-primary">Design Controls</h2>

            {/* Template Selection */}
            <div className="mb-6 p-4 border border-border rounded-lg shadow-sm bg-card">
              <Label htmlFor="template-select" className="mb-2 block text-lg font-medium">Select Template</Label>
              <Select onValueChange={handleTemplateChange} defaultValue={signatureData.template}>
                <SelectTrigger id="template-select" className="w-full">
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

            {/* Text Styling Section */}
            <TextStylingForm
              textStyling={signatureData.textStyling}
              onUpdate={handleTextStylingChange}
            />

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
              socialIconShape={signatureData.media.socialIconShape}
              onUpdateSocialIconShape={(shape) => handleMediaChange("socialIconShape", shape)}
            />

            {/* Media Section */}
            <MediaForm
              media={signatureData.media}
              onUpdate={handleMediaChange}
            />

            {/* Call-to-Action Section */}
            <CallToActionForm
              cta={signatureData.cta}
              onUpdate={handleCtaChange}
              brandColorPrimary={signatureData.company.brandColorPrimary}
              brandColorText={signatureData.company.brandColorText}
            />

            {/* Divider Section */}
            <DividerForm
              divider={signatureData.divider}
              onUpdate={handleDividerChange}
            />

            {/* Legal Section */}
            <LegalForm
              legal={signatureData.legal}
              onUpdate={handleLegalChange}
            />

            {/* Other sections will go here */}
            <div className="mt-8 p-4 border border-border rounded-lg bg-muted/20 text-muted-foreground shadow-sm">
              <p className="text-sm">More design controls and sections will be added here!</p>
            </div>
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col p-6 bg-gray-50 dark:bg-gray-900">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Live Preview</h2>
            <Tabs defaultValue="desktop" className="flex-grow flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-card border border-border shadow-sm">
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