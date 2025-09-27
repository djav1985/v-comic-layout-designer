import { TemplateVars } from './templateTypes';

export const CorporateStripTemplate = (templateVars: TemplateVars): string => {
  const {
    signatureData,
    previewMode,
    verticalSpacing,
    horizontalSpacing,
    linkColor,
    socialIconsHtml,
    logoUrl,
    bannerImageHtml,
    ctaButtonHtml,
    dividerHtml,
    legalHtml,
    mobileColumnTdStyle,
  } = templateVars;

  const { identity, company, contact, socialMedia, textStyling } = signatureData;

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="background-color: ${company.brandColorAccent || '#f0f0f0'}; padding: ${verticalSpacing} ${horizontalSpacing};">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td valign="middle" style="width: 120px; padding-right: ${horizontalSpacing}; ${previewMode === 'mobile' ? mobileColumnTdStyle : ''}">
                <img src="${logoUrl}" alt="${company.businessName} Logo" width="120" style="display: block; max-width: 120px; height: auto; margin: ${previewMode === 'mobile' ? `0 auto ${verticalSpacing} auto` : '0'};" />
              </td>
              <td valign="middle" style="${previewMode === 'mobile' ? mobileColumnTdStyle : ''}">
                <p style="margin: 0; font-size: ${textStyling.baseFontSize + 2}px; font-weight: bold; color: ${company.brandColorPrimary}; line-height: ${textStyling.baseLineHeight};">${identity.fullName}</p>
                <p style="margin: 0; font-size: ${textStyling.baseFontSize}px; color: ${company.brandColorText}; padding-bottom: ${verticalSpacing}; line-height: ${textStyling.baseLineHeight};">${identity.jobTitle}</p>
                <p style="margin: 0; font-size: ${textStyling.baseFontSize}px; line-height: ${textStyling.baseLineHeight};">
                  ${contact.emailAddress ? `<a href="mailto:${contact.emailAddress}" style="color: ${company.brandColorPrimary}; text-decoration: none;">${contact.emailAddress}</a>` : ''}
                  ${contact.emailAddress && contact.phoneNumbers ? ` &bull; ` : ''}
                  ${contact.phoneNumbers ? `<a href="tel:${contact.phoneNumbers.replace(/\s/g, '')}" style="color: ${company.brandColorPrimary}; text-decoration: none;">${contact.phoneNumbers}</a>` : ''}
                </p>
                ${socialMedia.length > 0 ? `<p style="margin: ${verticalSpacing} 0 0 0; line-height: ${textStyling.baseLineHeight};">${socialIconsHtml}</p>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: ${verticalSpacing} ${horizontalSpacing}; ${previewMode === 'mobile' ? 'text-align: center;' : ''}">
          ${bannerImageHtml}
          ${ctaButtonHtml}
          ${dividerHtml}
          ${legalHtml}
        </td>
      </tr>
    </table>
  `;
};