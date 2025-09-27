"use client";

import React, { useEffect, useRef, useState } from "react";
import { SignatureData } from "./SignatureDesigner";
import { Linkedin, X, Facebook, Instagram, Youtube, Globe, Github, Share2 } from "lucide-react";

interface SignaturePreviewProps {
  signatureData: SignatureData;
  previewMode: "desktop" | "mobile";
}

const getSocialIconSvg = (platform: string, color: string, shape: SignatureData['media']['socialIconShape']) => {
  const size = 16; // Icon size for email compatibility
  const bgColor = shape === "ghost" ? "transparent" : color;
  const iconColor = shape === "ghost" ? color : "#ffffff"; // If ghost, icon is brand color; otherwise (circle/square), icon is white.
  const borderRadius = shape === "circle" ? "50%" : (shape === "square" ? "0" : "0");
  const padding = shape === "ghost" ? "0" : "4px"; // Padding for background shapes

  let iconPath = '';
  switch (platform) {
    case "LinkedIn": iconPath = `<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>`; break;
    case "X": iconPath = `<path d="M18.244 2.25h3.308l-7.227 8.26 8.758 11.24H15.305L8.995 13.95 1.956 22H.654l7.73-9.94L.043 2.25h8.04L12.32 8.414 18.244 2.25zM17.292 19.75H19.15L7.31 4.25H5.362L17.292 19.75z"/>`; break; // Official X logo path
    case "Facebook": iconPath = `<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>`; break; // Lucide Facebook (filled)
    case "Instagram": iconPath = `<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>`; break; // Lucide Instagram (filled)
    case "YouTube": iconPath = `<path d="M18.7 3.3H5.3C3.4 3.3 2 4.7 2 6.6v10.8c0 1.9 1.4 3.3 3.3 3.3h13.4c1.9 0 3.3-1.4 3.3-3.3V6.6c0-1.9-1.4-3.3-3.3-3.3zM9.7 15.5V8.5l6 3.5-6 3.5z"/>`; break; // Filled YouTube
    case "GitHub": iconPath = `<path d="M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.165 6.839 9.488.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.109-1.465-1.109-1.465-.908-.619.069-.607.069-.607 1.004.07 1.532 1.03 1.532 1.03.892 1.529 2.341 1.089 2.91.833.091-.647.35-1.089.636-1.338-2.22-.253-4.555-1.119-4.555-4.95 0-1.091.39-1.984 1.029-2.682-.103-.253-.446-1.27.098-2.65 0 0 .84-.27 2.75 1.029A9.47 9.47 0 0 1 12 6.844c.85.004 1.701.114 2.503.332 1.909-1.299 2.747-1.029 2.747-1.029.546 1.38.203 2.398.098 2.65.64.698 1.029 1.591 1.029 2.682 0 3.839-2.339 4.69-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.579.688.482C21.135 20.165 24 16.419 24 12c0-5.523-4.477-10-10-10z"/>`; break; // Filled GitHub Octocat
    case "Website": iconPath = `<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>`; break; // Lucide Globe (outline, but acceptable for 'ghost' and will be filled by background for others)
    default: iconPath = `<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>`; break; // Lucide Share2 (outline, but acceptable for 'ghost' and will be filled by background for others)
  }

  const svgFill = shape === "ghost" ? "none" : iconColor; // If ghost, no fill; otherwise, fill with iconColor (white)
  const svgStroke = shape === "ghost" ? iconColor : "none"; // If ghost, stroke with iconColor (brand color); otherwise, no stroke.

  return `
    <span style="display: inline-block; background-color: ${bgColor}; border: none; border-radius: ${borderRadius}; padding: ${padding}; line-height: 0;">
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${svgFill}" stroke="${svgStroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${iconPath}
      </svg>
    </span>
  `;
};

const generateSignatureHtml = (data: SignatureData): string => {
  const { identity, company, contact, socialMedia, media, legal, cta, template } = data;

  // Determine headshot size
  let headshotPxSize = 80;
  if (media.headshotSize === "small") headshotPxSize = 60;
  if (media.headshotSize === "large") headshotPxSize = 100;

  // Determine headshot shape
  let headshotBorderRadius = "50%"; // circle
  if (media.headshotShape === "rounded") headshotBorderRadius = "8px";
  if (media.headshotShape === "square") headshotBorderRadius = "0";

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
      ${getSocialIconSvg(social.platform, linkColor, media.socialIconShape)}
    </a>
  `).join('');

  const headshotHtml = media.showHeadshot && media.headshotUrl ? `
    <img src="${media.headshotUrl}" alt="${identity.fullName} Headshot" width="${headshotPxSize}" height="${headshotPxSize}" style="display: block; border-radius: ${headshotBorderRadius}; max-width: ${headshotPxSize}px; height: auto;" />
  ` : '';

  const bannerHtml = media.showBanner && media.bannerUrl ? `
    <p style="margin-top: 15px; margin-bottom: 0;"><img src="${media.bannerUrl}" alt="${company.businessName} Banner" width="500" style="display: block; max-width: 100%; height: auto;" /></p>
  ` : '';

  const ctaButtonHtml = cta.showCta && cta.ctaLink && cta.ctaLabel ? `
    <p style="margin-top: 15px; margin-bottom: 0;">
      <a href="${cta.ctaLink}" target="_blank" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: ${cta.ctaStyle === "filled" ? company.brandColorPrimary : 'transparent'};
        color: ${cta.ctaStyle === "filled" ? '#ffffff' : company.brandColorPrimary};
        border: ${cta.ctaStyle === "outlined" ? `1px solid ${company.brandColorPrimary}` : 'none'};
        border-radius: ${cta.ctaCornerShape === "rounded" ? '5px' : '0'};
        text-decoration: none;
        font-weight: bold;
        font-size: 14px;
        line-height: 1;
      ">
        ${cta.ctaLabel}
      </a>
    </p>
  ` : '';

  const legalHtml = (legal.disclaimerText || legal.confidentialityNotice || legal.showEqualHousingBadge || legal.showHipaaBadge) ? `
    <p style="margin-top: 20px; font-size: 10px; color: #888888; line-height: 1.3;">
      ${legal.disclaimerText ? `<span>${legal.disclaimerText}</span><br/>` : ''}
      ${legal.confidentialityNotice ? `<span>${legal.confidentialityNotice}</span><br/>` : ''}
      ${legal.showEqualHousingBadge ? `<img src="https://via.placeholder.com/20x20?text=EHO" alt="Equal Housing Opportunity" style="display: inline-block; vertical-align: middle; margin-right: 5px;" />` : ''}
      ${legal.showHipaaBadge ? `<img src="https://via.placeholder.com/20x20?text=HIPAA" alt="HIPAA Compliant" style="display: inline-block; vertical-align: middle; margin-right: 5px;" />` : ''}
    </p>
  ` : '';

  let contentHtml = '';

  switch (template) {
    case "classic-two-column":
      contentHtml = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="${baseStyles}">
          <tr>
            ${headshotHtml ? `<td valign="top" style="padding-right: 10px; width: ${headshotPxSize}px;">${headshotHtml}</td>` : ''}
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
              ${bannerHtml}
              ${ctaButtonHtml}
              ${legalHtml}
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
              ${headshotHtml ? `<p style="margin-bottom: 10px; text-align: center;">${headshotHtml}</p>` : ''}
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
              ${bannerHtml}
              ${ctaButtonHtml}
              ${legalHtml}
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
              ${headshotHtml}
              <p style="margin: 0; font-size: 16px; font-weight: bold;">${identity.fullName}</p>
              <p style="margin: 0; font-size: 13px; color: #555555;">${identity.jobTitle}</p>
              <p style="margin: 0; font-size: 12px; color: #777777;">Template: ${template}</p>
              <p style="margin-top: 10px; font-size: 12px;">More details coming soon!</p>
              ${socialMedia.length > 0 ? `<p style="margin-top: 10px;">${socialIconsHtml}</p>` : ''}
              ${bannerHtml}
              ${ctaButtonHtml}
              ${legalHtml}
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
    setIframeContent(generateSignatureHtml(signatureData));
  }, [signatureData]);

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