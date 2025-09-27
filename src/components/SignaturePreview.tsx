"use client";

import React, { useEffect, useRef, useState } from "react";
import { SignatureData } from "./SignatureDesigner";
import { Linkedin, X, Facebook, Instagram, Youtube, Globe, Github, Share2 } from "lucide-react";

interface SignaturePreviewProps {
  signatureData: SignatureData;
  previewMode: "desktop" | "mobile";
  onHtmlContentReady: (html: string) => void; // New prop to pass HTML back
}

const getSocialIconSvg = (platform: string, color: string, shape: SignatureData['media']['socialIconShape']) => {
  const size = 16; // Icon size for email compatibility
  const bgColor = shape === "ghost" ? "transparent" : color;
  const iconColor = shape === "ghost" ? color : "#ffffff"; // If ghost, icon is brand color; otherwise (circle/square), icon is white.
  const borderRadius = shape === "circle" ? "50%" : (shape === "square" ? "0" : "0");
  const padding = shape === "ghost" ? "0" : "4px"; // Padding for background shapes

  // Determine fill and stroke for the SVG elements
  const svgFill = shape === "ghost" ? "none" : iconColor;
  const svgStroke = shape === "ghost" ? iconColor : "none";
  const svgStrokeWidth = shape === "ghost" ? "2" : "0"; // Only stroke for ghost, no stroke for filled

  let iconContent = ''; // Content inside the <svg> tag

  switch (platform) {
    case "LinkedIn": iconContent = `<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/><rect width="4" height="12" x="2" y="9" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/><circle cx="4" cy="4" r="2" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/>`; break;
    case "X": iconContent = `<path d="M18.244 2.25h3.308l-7.227 8.26 8.758 11.24H15.305L8.995 13.95 1.956 22H.654l7.73-9.94L.043 2.25h8.04L12.32 8.414 18.244 2.25zM17.292 19.75H19.15L7.31 4.25H5.362L17.292 19.75z" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/>`; break; // Official X logo path
    case "Facebook": iconContent = `<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/>`; break; // Lucide Facebook (filled)
    case "Instagram": iconContent = `<path d="M12 0C8.74 0 8.333.014 7.053.072 5.775.132 4.92.333 4.146.636 3.373.94 2.75 1.394 2.193 1.951.81 3.33.072 5.06.072 7.053c-.014 1.28-.072 1.688-.072 4.947 0 3.259.014 3.667.072 4.947.06 1.937.804 3.673 2.187 5.058 1.377 1.377 3.113 2.12 5.058 2.187 1.28.058 1.688.072 4.947.072 3.259 0 3.667-.014 4.947-.072 1.937-.06 3.673-.804 5.058-2.187 1.377-1.377 2.12-3.113 2.187-5.058.058-1.28.072-1.688.072-4.947 0-3.259-.014-3.667-.072-4.947-.06-1.937-.804-3.673-2.187-5.058C20.667.333 19.812.132 18.534.072 17.254.014 16.847 0 12 0zm0 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.204-.012 3.584-.07 4.85-1.48 3.228-1.691 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069-3.204 0-3.584-.012-4.85-.07-3.228-1.48-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.849 0-3.204.012-3.584.07-4.85 1.48-3.228 1.691-4.771 4.919-4.919 1.266-.058 1.644-.069 4.85-.069zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.44-.645 1.44-1.44s-.645-1.44-1.44-1.44z" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/>`; break; // Full Instagram logo path
    case "YouTube": iconContent = `<path d="M18.7 3.3H5.3C3.4 3.3 2 4.7 2 6.6v10.8c0 1.9 1.4 3.3 3.3 3.3h13.4c1.9 0 3.3-1.4 3.3-3.3V6.6c0-1.9-1.4-3.3-3.3-3.3zM9.7 15.5V8.5l6 3.5-6 3.5z" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/>`; break; // Filled YouTube
    case "GitHub": iconContent = `<path d="M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.165 6.839 9.488.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.109-1.465-1.109-1.465-.908-.619.069-.607.069-.607 1.004.07 1.532 1.03 1.532 1.03.892 1.529 2.341 1.089 2.91.833.091-.647.35-1.089.636-1.338-2.22-.253-4.555-1.119-4.555-4.95 0-1.091.39-1.984 1.029-2.682-.103-.253-.446-1.27.098-2.65 0 0 .84-.27 2.75 1.029A9.47 9.47 0 0 1 12 6.844c.85.004 1.701.114 2.503.332 1.909-1.299 2.747-1.029 2.747-1.029.546 1.38.203 2.398.098 2.65.64.698 1.029 1.591 1.029 2.682 0 3.839-2.339 4.69-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.579.688.482C21.135 20.165 24 16.419 24 12c0-5.523-4.477-10-10-10z" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/>`; break; // Filled GitHub Octocat
    case "Website": iconContent = `<circle cx="12" cy="12" r="10" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" fill="none" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/><path d="M2 12h20" fill="none" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/>`; break; // Lucide Globe (outline, but main circle fillable)
    default: iconContent = `<circle cx="18" cy="5" r="3" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/><circle cx="6" cy="12" r="3" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/><circle cx="18" cy="19" r="3" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/>`; break; // Lucide Share2 (outline, but circles fillable)
  }

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
      ${iconContent}
    </svg>
  `;

  // Base64 encode the SVG for use in an <img> tag
  const base64Svg = `data:image/svg+xml;base64,${btoa(svgString)}`;

  return `
    <span style="display: inline-block; background-color: ${bgColor}; border: none; border-radius: ${borderRadius}; padding: ${padding}; line-height: 0;">
      <img src="${base64Svg}" alt="${platform} icon" width="${size}" height="${size}" style="display: block; max-width: ${size}px; height: auto;" />
    </span>
  `;
};

const generateSignatureHtml = (data: SignatureData): string => {
  const { identity, company, contact, socialMedia, media, legal, cta, textStyling, divider, template, spacing } = data;

  // Determine spacing values
  let verticalSpacing = '10px';
  let horizontalSpacing = '10px';
  if (spacing === 'tight') {
    verticalSpacing = '5px';
    horizontalSpacing = '5px';
  } else if (spacing === 'roomy') {
    verticalSpacing = '15px';
    horizontalSpacing = '15px';
  }

  // Determine headshot size
  let headshotPxSize = 80;
  if (media.headshotSize === "small") headshotPxSize = 60;
  if (media.headshotSize === "large") headshotPxSize = 100;

  // Determine headshot shape
  let headshotBorderRadius = "50%"; // circle
  if (media.headshotShape === "rounded") headshotBorderRadius = "8px";
  if (media.headshotShape === "square") headshotBorderRadius = "0";

  // Base inline CSS for email compatibility, now including text styling
  const baseStyles = `
    font-family: ${textStyling.fontFamily}, 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: ${textStyling.baseFontSize}px;
    color: ${company.brandColorText || '#333333'};
    line-height: ${textStyling.baseLineHeight};
  `;

  const linkColor = company.brandColorPrimary || '#4285F4'; // Use default if not set

  const socialIconsHtml = socialMedia.map(social => `
    <a href="${social.url}" style="display: inline-block; margin-right: 8px; text-decoration: none; vertical-align: middle;" target="_blank">
      ${getSocialIconSvg(social.platform, linkColor, media.socialIconShape)}
    </a>
  `).join('');

  const logoUrl = company.logoUrl || `https://placehold.co/120x60/${company.brandColorPrimary.substring(1)}/FFFFFF/png?text=${encodeURIComponent(company.businessName.split(' ')[0])}Logo`;
  const dynamicHeadshotUrl = media.headshotUrl || `https://placehold.co/${headshotPxSize}/${company.brandColorAccent.substring(1)}/FFFFFF/png?text=${encodeURIComponent(identity.fullName.split(' ').map(n => n[0]).join(''))}`;
  const dynamicBannerUrl = media.bannerUrl || `https://placehold.co/600x100/${company.brandColorAccent.substring(1)}/FFFFFF/png?text=${encodeURIComponent(company.tagline || 'Promotional Banner')}`;

  const headshotHtml = media.showHeadshot ? `
    <img src="${dynamicHeadshotUrl}" alt="${identity.fullName} Headshot" width="${headshotPxSize}" height="${headshotPxSize}" style="display: block; border-radius: ${headshotBorderRadius}; max-width: ${headshotPxSize}px; height: auto; margin: 0;" />
  ` : '';

  const bannerImageHtml = media.showBanner ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding-top: ${verticalSpacing}; padding-bottom: 0;">
          <img src="${dynamicBannerUrl}" alt="${company.businessName} Banner" width="500" style="display: block; max-width: 100%; height: auto; margin: 0;" />
        </td>
      </tr>
    </table>
  ` : '';

  const ctaButtonHtml = cta.showCta && cta.ctaLink && cta.ctaLabel ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding-top: ${verticalSpacing}; padding-bottom: 0;">
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
            mso-hide: all; /* Outlook specific to hide border on filled button */
          ">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${cta.ctaLink}" style="height:36px;v-text-anchor:middle;width:150px;" arcsize="${cta.ctaCornerShape === "rounded" ? '14%' : '0%'}" strokecolor="${company.brandColorPrimary}" fill="${cta.ctaStyle === "filled" ? 'true' : 'false'}">
              <w:anchorlock/>
              <center style="color:${cta.ctaStyle === "filled" ? '#ffffff' : company.brandColorPrimary};font-family:Arial, sans-serif;font-size:14px;font-weight:bold;">
            <![endif]-->
            ${cta.ctaLabel}
            <!--[if mso]>
              </center>
            </v:roundrect>
            <![endif]-->
          </a>
        </td>
      </tr>
    </table>
  ` : '';

  const dividerHtml = divider.showDivider ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: ${verticalSpacing}; margin-bottom: ${verticalSpacing};">
      <tr>
        <td style="padding: 0;">
          <div style="height: ${divider.thickness}px; background-color: ${divider.color}; line-height: ${divider.thickness}px; font-size: ${divider.thickness}px;">&nbsp;</div>
        </td>
      </tr>
    </table>
  ` : '';

  const legalHtml = (legal.disclaimerText || legal.confidentialityNotice || legal.showEqualHousingBadge || legal.showHipaaBadge) ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding-top: ${verticalSpacing}; font-size: 10px; color: #888888; line-height: 1.3;">
          ${legal.disclaimerText ? `<span>${legal.disclaimerText}</span><br/>` : ''}
          ${legal.confidentialityNotice ? `<span>${legal.confidentialityNotice}</span><br/>` : ''}
          ${legal.showEqualHousingBadge ? `<img src="https://placehold.co/20x20/0000FF/FFFFFF/png?text=EHO" alt="Equal Housing Opportunity" style="display: inline-block; vertical-align: middle; margin-right: 5px;" />` : ''}
          ${legal.showHipaaBadge ? `<img src="https://placehold.co/20x20/008000/FFFFFF/png?text=HIPAA" alt="HIPAA Compliant" style="display: inline-block; vertical-align: middle; margin-right: 5px;" />` : ''}
        </td>
      </tr>
    </table>
  ` : '';

  let contentHtml = '';

  switch (template) {
    case "classic-two-column":
      contentHtml = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="${baseStyles} max-width: 600px;">
          <tr>
            <td style="padding-bottom: ${verticalSpacing};">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  ${headshotHtml ? `
                    <td valign="top" style="padding-right: ${horizontalSpacing}; width: ${headshotPxSize}px;">
                      ${headshotHtml}
                    </td>
                  ` : ''}
                  <td valign="top">
                    <p style="margin: 0; font-size: ${textStyling.baseFontSize + 2}px; font-weight: bold; color: ${company.brandColorPrimary};">${identity.fullName}</p>
                    <p style="margin: 0; font-size: ${textStyling.baseFontSize}px; color: ${company.brandColorText}; padding-bottom: ${verticalSpacing};">${identity.jobTitle} ${identity.department ? `| ${identity.department}` : ''}</p>
                    ${identity.pronouns ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize - 2}px; color: #777777; padding-bottom: ${verticalSpacing};">${identity.pronouns}</p>` : ''}
                    
                    <p style="margin: 0; font-size: ${textStyling.baseFontSize + 2}px; font-weight: bold; color: ${company.brandColorPrimary};">${company.businessName}</p>
                    ${company.tagline ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize}px; color: ${company.brandColorText}; padding-bottom: ${verticalSpacing};">${company.tagline}</p>` : ''}
                    
                    <p style="margin: 0; font-size: ${textStyling.baseFontSize}px;">
                      ${contact.phoneNumbers ? `<a href="tel:${contact.phoneNumbers.replace(/\s/g, '')}" style="color: ${linkColor}; text-decoration: none;">${contact.phoneNumbers}</a>` : ''}
                      ${contact.phoneNumbers && contact.emailAddress ? ` &bull; ` : ''}
                      ${contact.emailAddress ? `<a href="mailto:${contact.emailAddress}" style="color: ${linkColor}; text-decoration: none;">${contact.emailAddress}</a>` : ''}
                    </p>
                    <p style="margin: 0; font-size: ${textStyling.baseFontSize}px; padding-bottom: ${verticalSpacing};">
                      ${contact.websiteLink ? `<a href="${contact.websiteLink}" style="color: ${linkColor}; text-decoration: none;">${contact.websiteLink.replace(/^(https?:\/\/)/, '')}</a>` : ''}
                      ${contact.websiteLink && contact.officeAddress ? ` &bull; ` : ''}
                      ${contact.officeAddress ? `<span>${contact.officeAddress}</span>` : ''}
                    </p>
                    ${contact.bookingLink ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize}px; padding-bottom: ${verticalSpacing};"><a href="${contact.bookingLink}" style="color: ${linkColor}; text-decoration: none;">Book a Meeting</a></p>` : ''}
                    ${socialMedia.length > 0 ? `<p style="margin: 0; padding-bottom: ${verticalSpacing};">${socialIconsHtml}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top: ${verticalSpacing};">
              <img src="${logoUrl}" alt="${company.businessName} Logo" width="120" style="display: block; max-width: 120px; height: auto; margin: 0 0 ${verticalSpacing} 0;" />
              ${bannerImageHtml}
              ${ctaButtonHtml}
              ${dividerHtml}
              ${legalHtml}
            </td>
          </tr>
        </table>
      `;
      break;
    case "compact-single-column":
      contentHtml = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="${baseStyles} max-width: 600px; text-align: center;">
          <tr>
            <td style="padding-bottom: ${verticalSpacing};">
              <img src="${logoUrl}" alt="${company.businessName} Logo" width="100" style="display: block; margin: 0 auto ${verticalSpacing} auto; max-width: 100px; height: auto;" />
              ${headshotHtml ? `<div style="margin: 0 auto ${verticalSpacing} auto; width: ${headshotPxSize}px;">${headshotHtml}</div>` : ''}
              <p style="margin: 0; font-size: ${textStyling.baseFontSize + 2}px; font-weight: bold; color: ${company.brandColorPrimary};">${identity.fullName}</p>
              <p style="margin: 0; font-size: ${textStyling.baseFontSize}px; color: ${company.brandColorText};">${identity.jobTitle}</p>
              ${identity.department ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize - 2}px; color: #777777;">${identity.department}</p>` : ''}
              ${identity.pronouns ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize - 2}px; color: #777777;">${identity.pronouns}</p>` : ''}
              <p style="margin-top: ${verticalSpacing}; font-size: ${textStyling.baseFontSize + 2}px; font-weight: bold; color: ${company.brandColorPrimary};">${company.businessName}</p>
              ${company.tagline ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize}px; color: ${company.brandColorText};">${company.tagline}</p>` : ''}
              <p style="margin-top: ${verticalSpacing}; font-size: ${textStyling.baseFontSize}px;">
                ${contact.phoneNumbers ? `<a href="tel:${contact.phoneNumbers.replace(/\s/g, '')}" style="color: ${linkColor}; text-decoration: none;">${contact.phoneNumbers}</a>` : ''}
                ${contact.phoneNumbers && contact.emailAddress ? ` &bull; ` : ''}
                ${contact.emailAddress ? `<a href="mailto:${contact.emailAddress}" style="color: ${linkColor}; text-decoration: none;">${contact.emailAddress}</a>` : ''}
              </p>
              <p style="margin: 0; font-size: ${textStyling.baseFontSize}px;">
                ${contact.websiteLink ? `<a href="${contact.websiteLink}" style="color: ${linkColor}; text-decoration: none;">${contact.websiteLink.replace(/^(https?:\/\/)/, '')}</a>` : ''}
                ${contact.websiteLink && contact.officeAddress ? ` &bull; ` : ''}
                ${contact.officeAddress ? `<span>${contact.officeAddress}</span>` : ''}
              </p>
              ${contact.bookingLink ? `<p style="margin-top: ${verticalSpacing}; font-size: ${textStyling.baseFontSize}px;"><a href="${contact.bookingLink}" style="color: ${linkColor}; text-decoration: none;">Book a Meeting</a></p>` : ''}
              ${socialMedia.length > 0 ? `<p style="margin-top: ${verticalSpacing}; text-align: center;">${socialIconsHtml}</p>` : ''}
              ${bannerImageHtml}
              ${ctaButtonHtml}
              ${dividerHtml}
              ${legalHtml}
            </td>
          </tr>
        </table>
      `;
      break;
    case "corporate-strip":
      contentHtml = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="${baseStyles} max-width: 600px;">
          <tr>
            <td style="background-color: ${company.brandColorAccent || '#f0f0f0'}; padding: ${verticalSpacing} ${horizontalSpacing};">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td valign="middle" style="width: 80px; padding-right: ${horizontalSpacing};">
                    <img src="${logoUrl}" alt="${company.businessName} Logo" width="80" style="display: block; max-width: 80px; height: auto; margin: 0;" />
                  </td>
                  <td valign="middle">
                    <p style="margin: 0; font-size: ${textStyling.baseFontSize + 2}px; font-weight: bold; color: ${company.brandColorPrimary};">${identity.fullName}</p>
                    <p style="margin: 0; font-size: ${textStyling.baseFontSize}px; color: ${company.brandColorText}; padding-bottom: ${verticalSpacing};">${identity.jobTitle}</p>
                    <p style="margin: 0; font-size: ${textStyling.baseFontSize}px;">
                      ${contact.emailAddress ? `<a href="mailto:${contact.emailAddress}" style="color: ${company.brandColorPrimary}; text-decoration: none;">${contact.emailAddress}</a>` : ''}
                      ${contact.emailAddress && contact.phoneNumbers ? ` &bull; ` : ''}
                      ${contact.phoneNumbers ? `<a href="tel:${contact.phoneNumbers.replace(/\s/g, '')}" style="color: ${company.brandColorPrimary}; text-decoration: none;">${contact.phoneNumbers}</a>` : ''}
                    </p>
                    ${socialMedia.length > 0 ? `<p style="margin: ${verticalSpacing} 0 0 0;">${socialIconsHtml}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: ${verticalSpacing} ${horizontalSpacing};">
              ${bannerImageHtml}
              ${ctaButtonHtml}
              ${dividerHtml}
              ${legalHtml}
            </td>
          </tr>
        </table>
      `;
      break;
    case "card-with-cta":
      contentHtml = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="${baseStyles} max-width: 600px; border: 1px solid ${company.brandColorAccent || '#e0e0e0'}; border-radius: 8px; padding: ${verticalSpacing} ${horizontalSpacing}; background-color: #ffffff; text-align: center;">
          <tr>
            <td style="padding-bottom: ${verticalSpacing};">
              ${headshotHtml ? `<div style="margin: 0 auto ${verticalSpacing} auto; width: ${headshotPxSize}px;">${headshotHtml}</div>` : ''}
              <p style="margin: 0; font-size: ${textStyling.baseFontSize + 4}px; font-weight: bold; color: ${company.brandColorPrimary};">${identity.fullName}</p>
              <p style="margin: 0; font-size: ${textStyling.baseFontSize}px; color: ${company.brandColorText}; padding-bottom: ${verticalSpacing};">${identity.jobTitle}</p>
              <p style="margin: 0; font-size: ${textStyling.baseFontSize}px;">
                ${contact.emailAddress ? `<a href="mailto:${contact.emailAddress}" style="color: ${linkColor}; text-decoration: none;">${contact.emailAddress}</a>` : ''}
                ${contact.emailAddress && contact.phoneNumbers ? ` &bull; ` : ''}
                ${contact.phoneNumbers ? `<a href="tel:${contact.phoneNumbers.replace(/\s/g, '')}" style="color: ${linkColor}; text-decoration: none;">${contact.phoneNumbers}</a>` : ''}
              </p>
              ${socialMedia.length > 0 ? `<p style="margin: ${verticalSpacing} 0 0 0;">${socialIconsHtml}</p>` : ''}
              ${ctaButtonHtml}
              ${bannerImageHtml}
              ${dividerHtml}
              ${legalHtml}
            </td>
          </tr>
        </table>
      `;
      break;
    case "social-focused":
      contentHtml = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="${baseStyles} max-width: 600px; text-align: center;">
          <tr>
            <td style="padding-bottom: ${verticalSpacing};">
              <img src="${logoUrl}" alt="${company.businessName} Logo" width="100" style="display: block; margin: 0 auto ${verticalSpacing} auto; max-width: 100px; height: auto;" />
              <p style="margin: 0; font-size: ${textStyling.baseFontSize + 4}px; font-weight: bold; color: ${company.brandColorPrimary};">${company.businessName}</p>
              ${company.tagline ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize}px; color: ${company.brandColorText}; padding-bottom: ${verticalSpacing};">${company.tagline}</p>` : ''}
              ${socialMedia.length > 0 ? `<p style="margin: 0; padding-bottom: ${verticalSpacing};">${socialIconsHtml}</p>` : ''}
              <p style="margin: 0; font-size: ${textStyling.baseFontSize}px; color: ${company.brandColorText};">
                ${identity.fullName} ${identity.jobTitle ? `| ${identity.jobTitle}` : ''}
              </p>
              ${contact.websiteLink ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize - 2}px; color: #777777;">
                <a href="${contact.websiteLink}" style="color: ${linkColor}; text-decoration: none;">${contact.websiteLink.replace(/^(https?:\/\/)/, '')}</a>
              </p>` : ''}
              ${bannerImageHtml}
              ${ctaButtonHtml}
              ${dividerHtml}
              ${legalHtml}
            </td>
          </tr>
        </table>
      `;
      break;
    default:
      contentHtml = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="${baseStyles} max-width: 600px;">
          <tr>
            <td>
              ${headshotHtml}
              <p style="margin: 0; font-size: ${textStyling.baseFontSize + 2}px; font-weight: bold; color: ${company.brandColorPrimary};">${identity.fullName}</p>
              <p style="margin: 0; font-size: ${textStyling.baseFontSize}px; color: ${company.brandColorText}; padding-bottom: ${verticalSpacing};">${identity.jobTitle}</p>
              <p style="margin: 0; font-size: ${textStyling.baseFontSize - 2}px; color: #777777; padding-bottom: ${verticalSpacing};">Template: ${template}</p>
              <p style="margin: 0; font-size: ${textStyling.baseFontSize}px; padding-bottom: ${verticalSpacing};">More details coming soon!</p>
              ${socialMedia.length > 0 ? `<p style="margin: 0; padding-bottom: ${verticalSpacing};">${socialIconsHtml}</p>` : ''}
              ${bannerImageHtml}
              ${ctaButtonHtml}
              ${dividerHtml}
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
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Email Signature</title>
      <style type="text/css">
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        a[x-apple-data-detectors] {
          color: inherit !important;
          text-decoration: none !important;
          font-size: inherit !important;
          font-family: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
        }
        @media screen and (max-width: 525px) {
          .wrapper { width: 100% !important; max-width: 100% !important; }
          .responsive-table { width: 100% !important; }
          .mobile-hide { display: none !important; }
          .img-max { width: 100% !important; max-width: 100% !important; height: auto !important; }
          .padding { padding: 10px 5% 15px 5% !important; }
          .padding-meta { padding: 30px 5% 0px 5% !important; text-align: center; }
          .padding-copy { padding: 10px 5% 10px 5% !important; text-align: center; }
          .full-width-image img { width: 100% !important; }
          .container { padding: 0 10px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff;">
      <!--[if (gte mso 9)|(IE)]>
      <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="600">
      <tr>
      <td align="center" valign="top" width="600">
      <![endif]-->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="padding: 20px 0;">
            ${contentHtml}
          </td>
        </tr>
      </table>
      <!--[if (gte mso 9)|(IE)]>
      </td>
      </tr>
      </table>
      <![endif]-->
    </body>
    </html>
  `;
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
    const html = generateSignatureHtml(signatureData);
    setIframeContent(html);
    onHtmlContentReady(html); // Pass the generated HTML back to the parent
  }, [signatureData, onHtmlContentReady]);

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