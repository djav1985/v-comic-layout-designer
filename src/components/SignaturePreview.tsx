"use client";

import React, { useEffect, useRef, useState } from "react";
import { SignatureData } from "./SignatureDesigner";
import { Linkedin, X, Facebook, Instagram, Youtube, Globe, Github, Share2 } from "lucide-react";

interface SignaturePreviewProps {
  signatureData: SignatureData;
  previewMode: "desktop" | "mobile";
}

const getSocialIconSvg = (platform: string, color: string) => {
  const size = 16; // Icon size for email compatibility
  const iconProps = { color, size, fill: color }; // Fill for solid icons

  switch (platform) {
    case "LinkedIn": return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`;
    case "X": return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
    case "Facebook": return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`;
    case "Instagram": return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>`;
    case "YouTube": return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-youtube"><path d="M2.8 7.13a4.8 4.8 0 0 1 4.5-4.5h1.5c.3 0 .5.2.5.5v1.5c0 .3-.2.5-.5.5H7.3a2.8 2.8 0 0 0-2.7 2.7v10.5c0 1.5 1.2 2.7 2.7 2.7h9.4c1.5 0 2.7-1.2 2.7-2.7V7.3a2.8 2.8 0 0 0-2.7-2.7h-1.5c-.3 0-.5-.2-.5-.5V2.63c0-.3.2-.5.5-.5h1.5a4.8 4.8 0 0 1 4.5 4.5v10.5c0 2.6-2.2 4.8-4.8 4.8H7.3c-2.6 0-4.8-2.2-4.8-4.8V7.13z"/><path d="m10 10 5 2-5 2Z"/></svg>`;
    case "GitHub": return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.44-1-3.5.25-1.02.25-2.2.0-3.22v0c-.52-1.07-1.87-1.44-2.9-1.44-1.14 0-2.2.5-3.2 1.3-1.34-.78-2.78-.78-4.2 0C6.2 3.5 5.1 3 3.9 3c-1.03 0-2.38.37-2.9 1.44 0 0-.08.9-.0 3.22-.67 1.12-1 2.34-1 3.55 0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>`;
    case "Website": return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`;
    default: return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-share-2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>`;
  }
};

const generateSignatureHtml = (data: SignatureData): string => {
  const { identity, company, contact, socialMedia, template } = data;

  // Basic inline CSS for email compatibility
  const baseStyles = `
    font-family: Arial, sans-serif;
    font-size: 14px;
    color: ${company.brandColorText || '#333333'};
    line-height: 1.4;
  `;

  const linkColor = company.brandColorPrimary || '#1a73e8';

  const socialIconsHtml = socialMedia.map(social => `
    <a href="${social.url}" style="display: inline-block; margin-right: 8px; text-decoration: none;" target="_blank">
      ${getSocialIconSvg(social.platform, linkColor)}
    </a>
  `).join('');

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
              ${socialMedia.length > 0 ? `<p style="margin-top: 10px;">${socialIconsHtml}</p>` : ''}
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
              ${socialMedia.length > 0 ? `<p style="margin-top: 10px; text-align: center;">${socialIconsHtml}</p>` : ''}
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
              ${socialMedia.length > 0 ? `<p style="margin-top: 10px;">${socialIconsHtml}</p>` : ''}
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