import { TemplateVars } from './templateTypes';

export const CompactSingleColumnTemplate = (templateVars: TemplateVars): string => {
  const {
    signatureData,
    verticalSpacing,
    headshotPxSize,
    headshotHtml,
    linkColor,
    socialIconsHtml,
    logoUrl,
    bannerImageHtml,
    ctaButtonHtml,
    dividerHtml,
    legalHtml,
  } = templateVars;

  const { identity, company, contact, socialMedia, textStyling } = signatureData;

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="text-align: center;">
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
};