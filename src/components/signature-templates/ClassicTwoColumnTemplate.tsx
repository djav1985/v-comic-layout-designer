import { TemplateVars } from './templateTypes';

export const ClassicTwoColumnTemplate = (templateVars: TemplateVars): string => {
  const {
    signatureData,
    previewMode,
    verticalSpacing,
    horizontalSpacing,
    headshotPxSize,
    headshotHtml,
    linkColor,
    socialIconsHtml,
    logoUrl,
    bannerImageHtml,
    ctaButtonHtml,
    dividerHtml,
    legalHtml,
    mobileColumnTdStyle,
    mobileHeadshotWrapperStyle,
  } = templateVars;

  const { identity, company, contact, socialMedia, textStyling } = signatureData;

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding-bottom: ${verticalSpacing};">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              ${headshotHtml ? `
                <td valign="top" style="${previewMode === 'mobile' ? mobileColumnTdStyle : `padding-right: ${horizontalSpacing}; width: ${headshotPxSize}px;`}">
                  <div style="${previewMode === 'mobile' ? mobileHeadshotWrapperStyle : ''}">
                    ${headshotHtml}
                  </div>
                </td>
              ` : ''}
              <td valign="top" style="${previewMode === 'mobile' ? mobileColumnTdStyle : ''}">
                <p style="margin: 0; font-size: ${textStyling.baseFontSize + 2}px; font-weight: bold; color: ${company.brandColorPrimary}; line-height: ${textStyling.baseLineHeight};">${identity.fullName}</p>
                <p style="margin: 0; font-size: ${textStyling.baseFontSize}px; color: ${company.brandColorText}; padding-bottom: ${verticalSpacing}; line-height: ${textStyling.baseLineHeight};">${identity.jobTitle} ${identity.department ? `| ${identity.department}` : ''}</p>
                ${identity.pronouns ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize - 2}px; color: #777777; padding-bottom: ${verticalSpacing}; line-height: ${textStyling.baseLineHeight};">${identity.pronouns}</p>` : ''}
                
                <p style="margin: 0; font-size: ${textStyling.baseFontSize + 2}px; font-weight: bold; color: ${company.brandColorPrimary}; line-height: ${textStyling.baseLineHeight};">${company.businessName}</p>
                ${company.tagline ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize}px; color: ${company.brandColorText}; padding-bottom: ${verticalSpacing}; line-height: ${textStyling.baseLineHeight};">${company.tagline}</p>` : ''}
                
                <p style="margin: 0; font-size: ${textStyling.baseFontSize}px; line-height: ${textStyling.baseLineHeight};">
                  ${contact.phoneNumbers ? `<a href="tel:${contact.phoneNumbers.replace(/\s/g, '')}" style="color: ${linkColor}; text-decoration: none;">${contact.phoneNumbers}</a>` : ''}
                  ${contact.phoneNumbers && contact.emailAddress ? ` &bull; ` : ''}
                  ${contact.emailAddress ? `<a href="mailto:${contact.emailAddress}" style="color: ${linkColor}; text-decoration: none;">${contact.emailAddress}</a>` : ''}
                </p>
                <p style="margin: 0; font-size: ${textStyling.baseFontSize}px; padding-bottom: ${verticalSpacing}; line-height: ${textStyling.baseLineHeight};">
                  ${contact.websiteLink ? `<a href="${contact.websiteLink}" style="color: ${linkColor}; text-decoration: none;">${contact.websiteLink.replace(/^(https?:\/\/)/, '')}</a>` : ''}
                  ${contact.websiteLink && contact.officeAddress ? ` &bull; ` : ''}
                  ${contact.officeAddress ? `<span>${contact.officeAddress}</span>` : ''}
                </p>
                ${contact.bookingLink ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize}px; padding-bottom: ${verticalSpacing}; line-height: ${textStyling.baseLineHeight};"><a href="${contact.bookingLink}" style="color: ${linkColor}; text-decoration: none;">Book a Meeting</a></p>` : ''}
                ${socialMedia.length > 0 ? `<p style="margin: 0; padding-bottom: ${verticalSpacing}; line-height: ${textStyling.baseLineHeight};">${socialIconsHtml}</p>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-top: ${verticalSpacing}; ${previewMode === 'mobile' ? 'text-align: center;' : ''}">
          <img src="${logoUrl}" alt="${company.businessName} Logo" width="120" style="display: block; max-width: 120px; height: auto; margin: ${previewMode === 'mobile' ? '0 auto' : '0 0'} ${verticalSpacing} ${previewMode === 'mobile' ? 'auto' : '0'};" />
          ${bannerImageHtml}
          ${ctaButtonHtml}
          ${dividerHtml}
          ${legalHtml}
        </td>
      </tr>
    </table>
  `;
};