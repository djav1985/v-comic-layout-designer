import { TemplateVars } from './templateTypes';

export const MinimalistTemplate = (templateVars: TemplateVars): string => {
  const {
    signatureData,
    previewMode,
    verticalSpacing,
    horizontalSpacing,
    linkColor,
    socialIconsHtml,
    logoUrl,
    dividerHtml,
    legalHtml,
    headshotHtml, // Added headshotHtml
    headshotPxSize, // Added headshotPxSize for centering
  } = templateVars;

  const { identity, company, contact, socialMedia, textStyling } = signatureData;

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding-bottom: ${verticalSpacing};">
          ${headshotHtml ? `<div style="margin: 0 ${previewMode === 'mobile' ? 'auto' : '0'} ${verticalSpacing} ${previewMode === 'mobile' ? 'auto' : '0'}; width: ${headshotPxSize}px;">${headshotHtml}</div>` : ''}
          <p style="margin: 0; font-size: ${textStyling.baseFontSize + 2}px; font-weight: bold; color: ${company.brandColorPrimary}; line-height: ${textStyling.baseLineHeight};">${identity.fullName}</p>
          <p style="margin: 0; font-size: ${textStyling.baseFontSize}px; color: ${company.brandColorText}; line-height: ${textStyling.baseLineHeight};">${identity.jobTitle} at ${company.businessName}</p>
          ${identity.pronouns ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize - 2}px; color: #777777; line-height: ${textStyling.baseLineHeight};">${identity.pronouns}</p>` : ''}
          
          ${previewMode === 'mobile' ? `
            <!-- Mobile layout: stack contact info vertically -->
            <div style="margin-top: ${verticalSpacing};">
              ${contact.phoneNumbers ? `<div style="margin-bottom: 4px; font-size: ${textStyling.baseFontSize}px; line-height: ${textStyling.baseLineHeight};"><a href="tel:${contact.phoneNumbers.replace(/\s/g, '')}" style="color: ${linkColor}; text-decoration: none;">${contact.phoneNumbers}</a></div>` : ''}
              ${contact.emailAddress ? `<div style="margin-bottom: 4px; font-size: ${textStyling.baseFontSize}px; line-height: ${textStyling.baseLineHeight};"><a href="mailto:${contact.emailAddress}" style="color: ${linkColor}; text-decoration: none;">${contact.emailAddress}</a></div>` : ''}
              ${contact.websiteLink ? `<div style="font-size: ${textStyling.baseFontSize}px; line-height: ${textStyling.baseLineHeight};"><a href="${contact.websiteLink}" style="color: ${linkColor}; text-decoration: none;">${contact.websiteLink.replace(/^(https?:\/\/)/, '')}</a></div>` : ''}
            </div>
          ` : `
            <!-- Desktop layout: horizontal contact info -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top: ${verticalSpacing};">
              <tr>
                ${contact.phoneNumbers ? `<td style="padding-right: ${horizontalSpacing}; font-size: ${textStyling.baseFontSize}px; line-height: ${textStyling.baseLineHeight};"><a href="tel:${contact.phoneNumbers.replace(/\s/g, '')}" style="color: ${linkColor}; text-decoration: none;">${contact.phoneNumbers}</a></td>` : ''}
                ${contact.emailAddress ? `<td style="padding-right: ${horizontalSpacing}; font-size: ${textStyling.baseFontSize}px; line-height: ${textStyling.baseLineHeight};"><a href="mailto:${contact.emailAddress}" style="color: ${linkColor}; text-decoration: none;">${contact.emailAddress}</a></td>` : ''}
                ${contact.websiteLink ? `<td style="font-size: ${textStyling.baseFontSize}px; line-height: ${textStyling.baseLineHeight};"><a href="${contact.websiteLink}" style="color: ${linkColor}; text-decoration: none;">${contact.websiteLink.replace(/^(https?:\/\/)/, '')}</a></td>` : ''}
              </tr>
            </table>
          `}
          
          ${socialMedia.length > 0 ? `<p style="margin-top: ${verticalSpacing}; line-height: ${textStyling.baseLineHeight};">${socialIconsHtml}</p>` : ''}
          ${dividerHtml}
          <img src="${logoUrl}" alt="${company.businessName} Logo" width="120" style="display: block; max-width: 120px; height: auto; margin: ${verticalSpacing} 0 0 0;" />
          ${legalHtml}
        </td>
      </tr>
    </table>
  `;
};