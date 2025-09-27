import { TemplateVars } from './templateTypes';

export const SocialFocusedTemplate = (templateVars: TemplateVars): string => {
  const {
    signatureData,
    verticalSpacing,
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
};