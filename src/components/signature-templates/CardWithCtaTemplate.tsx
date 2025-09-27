import { TemplateVars } from './templateTypes';

export const CardWithCtaTemplate = (templateVars: TemplateVars): string => {
  const {
    signatureData,
    verticalSpacing,
    horizontalSpacing,
    headshotPxSize,
    headshotHtml,
    linkColor,
    socialIconsHtml,
    bannerImageHtml,
    ctaButtonHtml,
    dividerHtml,
    legalHtml,
  } = templateVars;

  const { identity, company, contact, socialMedia, textStyling } = signatureData;

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 0; padding: ${verticalSpacing} ${horizontalSpacing}; background-color: #ffffff; text-align: left;">
      <tr>
        <td style="padding-bottom: ${verticalSpacing};">
          ${headshotHtml ? `<div style="margin: 0 0 ${verticalSpacing} 0; width: ${headshotPxSize}px;">${headshotHtml}</div>` : ''}
          <p style="margin: 0; font-size: ${textStyling.baseFontSize + 4}px; font-weight: 700; color: ${company.brandColorPrimary}; line-height: ${textStyling.baseLineHeight};">${identity.fullName}</p>
          <p style="margin: 0; font-size: ${textStyling.baseFontSize}px; color: ${company.brandColorText}; padding-bottom: ${verticalSpacing}; line-height: ${textStyling.baseLineHeight}; font-weight: 500;">${identity.jobTitle}</p>
          <p style="margin: 0; font-size: ${textStyling.baseFontSize}px; line-height: ${textStyling.baseLineHeight};">
            ${contact.emailAddress ? `<a href="mailto:${contact.emailAddress}" style="color: ${linkColor}; text-decoration: none;">${contact.emailAddress}</a>` : ''}
            ${contact.emailAddress && contact.phoneNumbers ? ` &bull; ` : ''}
            ${contact.phoneNumbers ? `<a href="tel:${contact.phoneNumbers.replace(/\s/g, '')}" style="color: ${linkColor}; text-decoration: none; font-weight: 500;">${contact.phoneNumbers}</a>` : ''}
          </p>
          ${socialMedia.length > 0 ? `<p style="margin: ${verticalSpacing} 0 0 0; line-height: ${textStyling.baseLineHeight};">${socialIconsHtml}</p>` : ''}
          ${ctaButtonHtml}
          ${bannerImageHtml}
          ${dividerHtml}
          ${legalHtml}
        </td>
      </tr>
    </table>
  `;
};