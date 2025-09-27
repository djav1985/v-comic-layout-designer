"use client";

import React, { useEffect, useRef, useState } from "react";
import { SignatureData } from "./SignatureDesigner";

interface SignaturePreviewProps {
  signatureData: SignatureData;
  previewMode: "desktop" | "mobile";
}

const generateSignatureHtml = (data: SignatureData): string => {
  const { identity, company, contact, template } = data;

  // Basic inline CSS for email compatibility
  const baseStyles = `
    font-family: Arial, sans-serif;
    font-size: 14px;
    color: ${company.brandColorText || '#333333'};
    line-height: 1.4;
  `;

  const linkColor = company.brandColorPrimary || '#1a73e8';

  let contentHtml = '';

  switch (template) {
    case "classic-two-column":
      contentHtml = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="${baseStyles}">
          <tr>
            <td valign="top" style="padding-right: 10px; width: 100px;">
              <img src="https://via.placeholder.com/80" alt="Headshot" width="80" height="80" style="display: block; border-radius: 50%;" />
            </td>
            <td valign="top">
              <p style="margin: 0; font-size: 16px; font-weight: bold;">${identity.fullName}</p>
              <p style="margin: 0; font-size: 13px; color: #555555;">${identity.jobTitle} | ${identity.department}</p>
              <p style="margin: 0; font-size: 12px; color: #777777;">${identity.pronouns}</p>
              <p style="margin-top: 10px; margin-bottom: 5px; font-size: 14px; font-weight: bold;">${company.businessName}</p>
              <p style="margin: 0; font-size: 12px; color: #555555;">${company.tagline}</p>
              <p style="margin-top: 10px; font-size: 12px;">
                ${contact.phoneNumbers ? `<a href="tel:${contact.phoneNumbers}" style="color: ${linkColor}; text-decoration: none;">${contact.phoneNumbers}</a> | ` : ''}
                ${contact.emailAddress ? `<a href="mailto:${contact.emailAddress}" style="color: ${linkColor}; text-decoration: none;">${contact.emailAddress}</a>` : ''}
              </p>
              <p style="margin: 0; font-size: 12px;">
                ${contact.websiteLink ? `<a href="${contact.websiteLink}" style="color: ${linkColor}; text-decoration: none;">Website</a>` : ''}
                ${contact.websiteLink && contact.officeAddress ? ` | ` : ''}
                ${contact.officeAddress ? `<span>${contact.officeAddress}</span>` : ''}
              </p>
              ${contact.bookingLink ? `<p style="margin-top: 5px; font-size: 12px;"><a href="${contact.bookingLink}" style="color: ${linkColor}; text-decoration: none;">Book a Meeting</a></p>` : ''}
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 10px;">
              <img src="${company.logoUrl}" alt="${company.businessName} Logo" width="100" style="display: block; max-width: 100px; height: auto;" />
            </td>
          </tr>
        </table>
      `;
      break;
    case "compact-single-column":
      contentHtml = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="${baseStyles}">
          <tr>
            <td style="text-align: center;">
              <img src="${company.logoUrl}" alt="${company.businessName} Logo" width="80" style="display: block; margin: 0 auto 10px auto; max-width: 80px; height: auto;" />
              <p style="margin: 0; font-size: 16px; font-weight: bold;">${identity.fullName}</p>
              <p style="margin: 0; font-size: 13px; color: #555555;">${identity.jobTitle}</p>
              <p style="margin: 0; font-size: 12px; color: #777777;">${identity.department}</p>
              <p style="margin: 0; font-size: 12px; color: #777777;">${identity.pronouns}</p>
              <p style="margin-top: 10px; margin-bottom: 5px; font-size: 14px; font-weight: bold;">${company.businessName}</p>
              <p style="margin: 0; font-size: 12px; color: #555555;">${company.tagline}</p>
              <p style="margin-top: 10px; font-size: 12px;">
                ${contact.phoneNumbers ? `<a href="tel:${contact.phoneNumbers}" style="color: ${linkColor}; text-decoration: none;">${contact.phoneNumbers}</a>` : ''}
                ${contact.phoneNumbers && contact.emailAddress ? ` | ` : ''}
                ${contact.emailAddress ? `<a href="mailto:${contact.emailAddress}" style="color: ${linkColor}; text-decoration: none;">${contact.emailAddress}</a>` : ''}
              </p>
              <p style="margin: 0; font-size: 12px;">
                ${contact.websiteLink ? `<a href="${contact.websiteLink}" style="color: ${linkColor}; text-decoration: none;">Website</a>` : ''}
                ${contact.websiteLink && contact.officeAddress ? ` | ` : ''}
                ${contact.officeAddress ? `<span>${contact.officeAddress}</span>` : ''}
              </p>
              ${contact.bookingLink ? `<p style="margin-top: 5px; font-size: 12px;"><a href="${contact.bookingLink}" style="color: ${linkColor}; text-decoration: none;">Book a Meeting</a></p>` : ''}
            </td>
          </tr>
        </table>
      `;
      break;
    // Add more template cases here as they are implemented
    default:
      contentHtml = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="${baseStyles}">
          <tr>
            <td>
              <p style="margin: 0; font-size: 16px; font-weight: bold;">${identity.fullName}</p>
              <p style="margin: 0; font-size: 13px; color: #555555;">${identity.jobTitle}</p>
              <p style="margin: 0; font-size: 12px; color: #777777;">Template: ${template}</p>
              <p style="margin-top: 10px; font-size: 12px;">More details coming soon!</p>
            </td>
          </tr>
        </table>
      `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; }
        p { margin: 0; }
        a { text-decoration: none; }
      </style>
    </head>
    <body>
      ${contentHtml}
    </body>
    </html>
  `;
};

export const SignaturePreview: React.FC<SignaturePreviewProps> = ({ signatureData, previewMode }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeContent, setIframeContent] = useState("");

  useEffect(() => {
    setIframeContent(generateSignatureHtml(signatureData));
  }, [signatureData]);

  useEffect(() => {
    if (iframeRef.current && iframeContent) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(iframeContent);
        iframeDoc.close();
      }
    }
  }, [iframeContent]);

  const previewWidth = previewMode === "desktop" ? "100%" : "320px"; // Common mobile width

  return (
    <div className="flex-grow flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-md shadow-inner overflow-hidden">
      <div
        className="bg-white p-4 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg transition-all duration-300 ease-in-out"
        style={{ width: previewWidth, maxWidth: "600px", minHeight: "150px" }}
      >
        <iframe
          ref={iframeRef}
          title="Email Signature Preview"
          className="w-full h-full border-none bg-transparent"
          style={{ minHeight: "100px" }}
        />
      </div>
    </div>
  );
};