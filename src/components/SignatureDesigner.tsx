"use client";

import React, { useState, useCallback } from "react";
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
import { TextStylingForm } from "./forms/TextStylingForm";
import { DividerForm } from "./forms/DividerForm";
import { GlobalSpacingForm } from "./forms/GlobalSpacingForm";
import { SignatureOutputActions } from "./SignatureOutputActions";
import { showSuccess, showError } from "@/utils/toast";
import { generateVCard } from "@/utils/vcard";

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
  spacing: "tight" | "normal" | "roomy";
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
      logoUrl: "https://placehold.co/120x60/4285F4/FFFFFF/png?text=YourLogo",
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
      headshotUrl: "https://placehold.co/100/FFD700/FFFFFF/png?text=JD",
      showHeadshot: true,
      headshotShape: "circle",
      headshotSize: "medium",
      bannerUrl: "https://placehold.co/600x100/FF6347/FFFFFF/png?text=PromotionalBanner",
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
    spacing: "normal",
  });

  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [formValidations, setFormValidations] = useState<Map<string, boolean>>(new Map());

  const handleValidationChange = useCallback((formName: string, isValid: boolean) => {
    setFormValidations(prev => {
      const newMap = new Map(prev);
      newMap.set(formName, isValid);
      return newMap;
    });
  }, []);

  const isOverallFormValid = Array.from(formValidations.values()).every(isValid => isValid);

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

  const handleSpacingChange = (value: SignatureData['spacing']) => {
    setSignatureData(prevData => ({
      ...prevData,
      spacing: value,
    }));
  };

  const handleTemplateChange = (value: string) => {
    setSignatureData(prevData => ({
      ...prevData,
      template: value,
    }));
  };

  const handleHtmlContentReady = useCallback((html: string) => {
    setGeneratedHtml(html);
  }, []);

  const handleCopyHtml = async () => {
    if (!isOverallFormValid) {
      showError("Please fix validation errors before copying HTML.");
      return;
    }
    if (!generatedHtml) {
      showError("No signature HTML to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(generatedHtml);
      showSuccess("Signature HTML copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy HTML: ", err);
      showError("Failed to copy HTML. Please try again.");
    }
  };

  const handleExportPng = () => {
    if (!isOverallFormValid) {
      showError("Please fix validation errors before exporting PNG.");
      return;
    }
    showError("Export PNG functionality is not yet implemented.");
  };

  const handleGenerateVCard = () => {
    if (!isOverallFormValid) {
      showError("Please fix validation errors before generating vCard.");
      return;
    }
    try {
      const vcard = generateVCard(signatureData.identity, signatureData.contact, signatureData.company.businessName);
      const blob = new Blob([vcard], { type: "text/vcard" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${signatureData.identity.fullName.replace(/\s/g, '_')}.vcf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess("vCard generated and downloaded!");
    } catch (err) {
      console.error("Failed to generate vCard: ", err);
      showError("Failed to generate vCard. Please check your contact info.");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <h1 className="text-4xl font-extrabold p-4 border-b border-border shadow-lg bg-primary text-primary-foreground">Email Signature Designer</h1>
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-grow"
      >
        <ResizablePanel defaultSize={50} minSize={30} className="bg-gray-50 dark:bg-gray-900">
          <ScrollArea className="h-full p-6">
            <h2 className="text-2xl font-bold mb-6 text-primary">Design Controls</h2>

            {/* Template Selection */}
            <div className="mb-6 p-4 border border-border rounded-lg shadow-xl bg-card transition-all duration-200 hover:shadow-2xl hover:translate-y-[-2px]">
              <Label htmlFor="template-select" className="mb-2 block text-lg font-semibold text-foreground">Select Template</Label>
              <Select onValueChange={handleTemplateChange} defaultValue={signatureData.template}>
                <SelectTrigger id="template-select" className="w-full bg-input text-foreground border-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all duration-200">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-border shadow-lg">
                  <SelectItem value="classic-two-column">Classic Two-Column</SelectItem>
                  <SelectItem value="compact-single-column">Compact Single-Column</SelectItem>
                  <SelectItem value="corporate-strip">Corporate Strip</SelectItem>
                  <SelectItem value="card-with-cta">Card with Call-to-Action</SelectItem>
                  <SelectItem value="social-focused">Social-Focused Design</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Global Spacing Section */}
            <GlobalSpacingForm
              spacing={signatureData.spacing}
              onUpdate={handleSpacingChange}
              onValidationChange={handleValidationChange}
            />

            {/* Text Styling Section */}
            <TextStylingForm
              textStyling={signatureData.textStyling}
              onUpdate={handleTextStylingChange}
              onValidationChange={handleValidationChange}
            />

            {/* Identity Section */}
            <IdentityForm
              identity={signatureData.identity}
              onUpdate={handleIdentityChange}
              onValidationChange={handleValidationChange}
            />

            {/* Company Section */}
            <CompanyForm
              company={signatureData.company}
              onUpdate={handleCompanyChange}
              onValidationChange={handleValidationChange}
            />

            {/* Contact Info Section */}
            <ContactInfoForm
              contact={signatureData.contact}
              onUpdate={handleContactChange}
              onValidationChange={handleValidationChange}
            />

            {/* Social Media Section */}
            <SocialMediaForm
              socialMedia={signatureData.socialMedia}
              onUpdate={handleSocialMediaChange}
              socialIconShape={signatureData.media.socialIconShape}
              onUpdateSocialIconShape={(shape) => handleMediaChange("socialIconShape", shape)}
              onValidationChange={handleValidationChange}
            />

            {/* Media Section */}
            <MediaForm
              media={signatureData.media}
              onUpdate={handleMediaChange}
              onValidationChange={handleValidationChange}
            />

            {/* Call-to-Action Section */}
            <CallToActionForm
              cta={signatureData.cta}
              onUpdate={handleCtaChange}
              brandColorPrimary={signatureData.company.brandColorPrimary}
              brandColorText={signatureData.company.brandColorText}
              onValidationChange={handleValidationChange}
            />

            {/* Divider Section */}
            <DividerForm
              divider={signatureData.divider}
              onUpdate={handleDividerChange}
              onValidationChange={handleValidationChange}
            />

            {/* Legal Section */}
            <LegalForm
              legal={signatureData.legal}
              onUpdate={handleLegalChange}
              onValidationChange={handleValidationChange}
            />

            {/* Other sections will go here */}
            <div className="mt-8 p-4 border border-border rounded-lg bg-muted/20 text-muted-foreground shadow-md">
              <p className="text-sm">More design controls and sections will be added here!</p>
            </div>
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-border hover:bg-primary transition-colors duration-200" />
        <ResizablePanel defaultSize={50} minSize={30} className="bg-white dark:bg-gray-800">
          <div className="h-full flex flex-col p-6">
            <h2 className="text-2xl font-bold mb-4 text-primary">Live Preview</h2>
            <Tabs defaultValue="desktop" className="flex-grow flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-card border border-border shadow-md rounded-lg overflow-hidden">
                <TabsTrigger value="desktop" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-secondary data-[state=inactive]:text-secondary-foreground hover:bg-primary/90 hover:text-primary-foreground transition-colors duration-200 font-medium">Desktop</TabsTrigger>
                <TabsTrigger value="mobile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-secondary data-[state=inactive]:text-secondary-foreground hover:bg-primary/90 hover:text-primary-foreground transition-colors duration-200 font-medium">Mobile</TabsTrigger>
              </TabsList>
              <TabsContent value="desktop" className="flex-grow flex flex-col data-[state=inactive]:hidden">
                <SignaturePreview signatureData={signatureData} previewMode="desktop" onHtmlContentReady={handleHtmlContentReady} />
              </TabsContent>
              <TabsContent value="mobile" className="flex-grow flex flex-col data-[state=inactive]:hidden">
                <SignaturePreview signatureData={signatureData} previewMode="mobile" onHtmlContentReady={handleHtmlContentReady} />
              </TabsContent>
            </Tabs>
            <SignatureOutputActions
              onCopyHtml={handleCopyHtml}
              onExportPng={handleExportPng}
              onGenerateVCard={handleGenerateVCard}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default SignatureDesigner;