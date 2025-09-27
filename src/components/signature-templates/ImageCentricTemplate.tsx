import { TemplateVars } from './templateTypes';

export const ImageCentricTemplate = (templateVars: TemplateVars): string => {
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
          ${headshotHtml ? `<div style="margin: 0 auto ${verticalSpacing} auto; width: ${headshotPxSize}px;">${headshotHtml}</div>` : ''}
          ${bannerImageHtml}
          <p style="margin: ${verticalSpacing} 0 0 0; font-size: ${textStyling.baseFontSize + 4}px; font-weight: bold; color: ${company.brandColorPrimary};">${identity.fullName}</p>
          <p style="margin: 0; font-size: ${textStyling.baseFontSize + 1}px; color: ${company.brandColorText};">${identity.jobTitle} ${identity.department ? `| ${identity.department}` : ''}</p>
          ${identity.pronouns ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize - 1}px; color: #777777;">${identity.pronouns}</p>` : ''}
          ${dividerHtml}
          <p style="margin: ${verticalSpacing} 0 0 0; font-size: ${textStyling.baseFontSize}px;">
            ${contact.phoneNumbers ? `<a href="tel:${contact.phoneNumbers.replace(/\s/g, '')}" style="color: ${linkColor}; text-decoration: none;">${contact.phoneNumbers}</a>` : ''}
            ${contact.phoneNumbers && contact.emailAddress ? ` &bull; ` : ''}
            ${contact.emailAddress ? `<a href="mailto:${contact.emailAddress}" style="color: ${linkColor}; text-decoration: none;">${contact.emailAddress}</a>` : ''}
          </p>
          <p style="margin: 0; font-size: ${textStyling.baseFontSize}px;">
            ${contact.websiteLink ? `<a href="${contact.websiteLink}" style="color: ${linkColor}; text-decoration: none;">${contact.websiteLink.replace(/^(https?:\/\/)/, '')}</a>` : ''}
            ${contact.websiteLink && contact.officeAddress ? ` &bull; ` : ''}
            ${contact.officeAddress ? `<span>${contact.officeAddress}</span>` : ''}
          </p>
          ${contact.bookingLink ? `<p style="margin: ${verticalSpacing} 0 0 0; font-size: ${textStyling.baseFontSize}px;"><a href="${contact.bookingLink}" style="color: ${linkColor}; text-decoration: none;">Book a Meeting</a></p>` : ''}
          ${socialMedia.length > 0 ? `<p style="margin-top: ${verticalSpacing};">${socialIconsHtml}</p>` : ''}
          <img src="${logoUrl}" alt="${company.businessName} Logo" width="120" style="display: block; max-width: 120px; height: auto; margin: ${verticalSpacing} auto 0 auto;" />
          ${ctaButtonHtml}
          ${legalHtml}
        </td>
      </tr>
    </table>
  `;
};