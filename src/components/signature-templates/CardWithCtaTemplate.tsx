import { TemplateVars } from './templateTypes';

export const CardWithCtaTemplate = (templateVars: TemplateVars): string => {
  const {
    signatureData,
    verticalSpacing,
    headshotPxSize,
    headshotHtml,
    linkColor,
    socialIconsHtml,
    bannerImageHtml,
    ctaButtonHtml,
    dividerHtml,
    legalHtml,
  } = templateVars;

  const { identity, company, contact, textStyling } = signatureData;

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid ${company.brandColorAccent || '#e0e0e0'}; border-radius: 8px; padding: ${verticalSpacing} ${horizontalSpacing}; background-color: #ffffff; text-align: center;">
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
          ${signatureData.socialMedia.length > 0 ? `<p style="margin: ${verticalSpacing} 0 0 0;">${socialIconsHtml}</p>` : ''}
          ${ctaButtonHtml}
          ${bannerImageHtml}
          ${dividerHtml}
          ${legalHtml}
        </td>
      </tr>
    </table>
  `;
};