"use client";

import React, { useEffect, useRef, useState } from "react";
import { SignatureData } from "./SignatureDesigner";
import { BaseTemplate } from './signature-templates/BaseTemplate';
import { ClassicTwoColumnTemplate } from './signature-templates/ClassicTwoColumnTemplate';
import { CompactSingleColumnTemplate } from './signature-templates/CompactSingleColumnTemplate';
import { CorporateStripTemplate } from './signature-templates/CorporateStripTemplate';
import { CardWithCtaTemplate } from './signature-templates/CardWithCtaTemplate';
import { SocialFocusedTemplate } from './signature-templates/SocialFocusedTemplate';
import { MinimalistTemplate } from './signature-templates/MinimalistTemplate';
import { ModernHorizontalTemplate } from './signature-templates/ModernHorizontalTemplate';
import { ImageCentricTemplate } from './signature-templates/ImageCentricTemplate';
import { TemplateVars } from './signature-templates/templateTypes'; // Import TemplateVars

interface SignaturePreviewProps {
  signatureData: SignatureData;
  previewMode: "desktop" | "mobile";
  onHtmlContentReady: (html: string) => void; // New prop to pass HTML back
}

// This function dispatches to the correct template function
const renderTemplateContent = (templateName: string, templateVars: TemplateVars): string => {
  switch (templateName) {
    case "classic-two-column":
      return ClassicTwoColumnTemplate(templateVars);
    case "compact-single-column":
      return CompactSingleColumnTemplate(templateVars);
    case "corporate-strip":
      return CorporateStripTemplate(templateVars);
    case "card-with-cta":
      return CardWithCtaTemplate(templateVars);
    case "social-focused":
      return SocialFocusedTemplate(templateVars);
    case "minimalist":
      return MinimalistTemplate(templateVars);
    case "modern-horizontal":
      return ModernHorizontalTemplate(templateVars);
    case "image-centric":
      return ImageCentricTemplate(templateVars);
    default:
      // Fallback for unknown templates
      return `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="${templateVars.baseStyles} max-width: 600px;">
          <tr>
            <td>
              <p style="margin: 0; font-size: ${templateVars.signatureData.textStyling.baseFontSize + 2}px; font-weight: bold; color: ${templateVars.signatureData.company.brandColorPrimary};">${templateVars.signatureData.identity.fullName}</p>
              <p style="margin: 0; font-size: ${templateVars.signatureData.textStyling.baseFontSize}px; color: ${templateVars.signatureData.company.brandColorText}; padding-bottom: ${templateVars.verticalSpacing};">${templateVars.signatureData.identity.jobTitle}</p>
              <p style="margin: 0; font-size: ${templateVars.signatureData.textStyling.baseFontSize - 2}px; color: #777777; padding-bottom: ${templateVars.verticalSpacing};">Template: ${templateName}</p>
              <p style="margin: 0; font-size: ${templateVars.signatureData.textStyling.baseFontSize}px; padding-bottom: ${templateVars.verticalSpacing};">More details coming soon!</p>
              ${templateVars.signatureData.socialMedia.length > 0 ? `<p style="margin: 0; padding-bottom: ${templateVars.verticalSpacing};">${templateVars.socialIconsHtml}</p>` : ''}
              ${templateVars.bannerImageHtml}
              ${templateVars.ctaButtonHtml}
              ${templateVars.dividerHtml}
              ${templateVars.legalHtml}
            </td>
          </tr>
        </table>
      `;
  }
};

export const SignaturePreview: React.FC<SignaturePreviewProps> = ({ signatureData, previewMode, onHtmlContentReady }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeContent, setIframeContent] = useState("");
  const [iframeHeight, setIframeHeight] = useState("auto"); // State to control iframe height

  const adjustIframeHeight = () => {
    if (iframeRef.current) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc && iframeDoc.body) {
        // Set height to scrollHeight to fit content, plus a small buffer
        setIframeHeight(`${iframeDoc.body.scrollHeight + 20}px`);
      }
    }
  };

  useEffect(() => {
    // BaseTemplate now takes an object with signatureData, previewMode, and a children function
    const html = BaseTemplate({
      signatureData,
      previewMode,
      children: (templateVars) => renderTemplateContent(signatureData.template, templateVars)
    });
    setIframeContent(html);
    onHtmlContentReady(html); // Pass the generated HTML back to the parent
  }, [signatureData, previewMode, onHtmlContentReady]);

  useEffect(() => {
    if (iframeRef.current && iframeContent) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(iframeContent);
        iframeDoc.close();

        // Add event listener for content changes within the iframe
        // This is important for dynamic content or when images load
        iframeRef.current.onload = adjustIframeHeight;
        // Also call it immediately in case content is already loaded or very small
        adjustIframeHeight();
      }
    }
  }, [iframeContent]); // Re-run when content changes

  const previewWidth = previewMode === "desktop" ? "100%" : "320px"; // Common mobile width

  return (
    <div className="flex-grow flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-md shadow-inner overflow-hidden">
      <div
        className="bg-white p-4 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg transition-all duration-300 ease-in-out"
        style={{
          width: previewWidth,
          maxWidth: "600px",
          flexGrow: 1, // Allow this container to grow
          overflowY: "auto", // This container will scroll if content is too long
        }}
      >
        <iframe
          ref={iframeRef}
          title="Email Signature Preview"
          className="w-full border-none bg-transparent"
          style={{ height: iframeHeight }} // Use dynamic height
        />
      </div>
    </div>
  );
};