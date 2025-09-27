import { TemplateVars } from './templateTypes';

export const ModernHorizontalTemplate = (templateVars: TemplateVars): string => {
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

  const { identity, company, contact, textStyling } = signatureData;

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding-bottom: ${verticalSpacing};">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td valign="top" style="${previewMode === 'mobile' ? mobileColumnTdStyle : `width: 60%; padding-right: ${horizontalSpacing};`}">
                <p style="margin: 0; font-size: ${textStyling.baseFontSize + 4}px; font-weight: bold; color: ${company.brandColorPrimary};">${identity.fullName}</p>
                <p style="margin: 0; font-size: ${textStyling.baseFontSize + 1}px; color: ${company.brandColorText};">${identity.jobTitle}</p>
                ${identity.department ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize}px; color: #777777;">${identity.department}</p>` : ''}
                ${identity.pronouns ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize - 1}px; color: #777777;">${identity.pronouns}</p>` : ''}
                <p style="margin: ${verticalSpacing} 0 0 0; font-size: ${textStyling.baseFontSize + 2}px; font-weight: bold; color: ${company.brandColorPrimary};">${company.businessName}</p>
                ${company.tagline ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize}px; color: ${company.brandColorText};">${company.tagline}</p>` : ''}
              </td>
              <td valign="top" style="${previewMode === 'mobile' ? mobileColumnTdStyle : `width: 40%; text-align: right;`}">
                <img src="${logoUrl}" alt="${company.businessName} Logo" width="100" style="display: block; max-width: 100px; height: auto; margin: ${previewMode === 'mobile' ? '0 auto' : '0 0'} ${verticalSpacing} ${previewMode === 'mobile' ? 'auto' : 'auto'};" />
                ${headshotHtml ? `<div style="margin: ${previewMode === 'mobile' ? '0 auto' : '0 0'} ${verticalSpacing} ${previewMode === 'mobile' ? 'auto' : 'auto'}; width: ${headshotPxSize}px;">${headshotHtml}</div>` : ''}
              </td>
            </tr>
          </table>
          ${dividerHtml}
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: ${verticalSpacing}; ${previewMode === 'mobile' ? 'text-align: center;' : ''}">
            <tr>
              <td valign="top" style="${previewMode === 'mobile' ? mobileColumnTdStyle : `width: 50%; padding-right: ${horizontalSpacing};`}">
                ${contact.phoneNumbers ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize}px;"><a href="tel:${contact.phoneNumbers.replace(/\s/g, '')}" style="color: ${linkColor}; text-decoration: none;">${contact.phoneNumbers}</a></p>` : ''}
                ${contact.emailAddress ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize}px;"><a href="mailto:${contact.emailAddress}" style="color: ${linkColor}; text-decoration: none;">${contact.emailAddress}</a></p>` : ''}
              </td>
              <td valign="top" style="${previewMode === 'mobile' ? mobileColumnTdStyle : `width: 50%;`}">
                ${contact.websiteLink ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize}px;"><a href="${contact.websiteLink}" style="color: ${linkColor}; text-decoration: none;">${contact.websiteLink.replace(/^(https?:\/\/)/, '')}</a></p>` : ''}
                ${contact.officeAddress ? `<p style="margin: 0; font-size: ${textStyling.baseFontSize}px;">${contact.officeAddress}</p>` : ''}
              </td>
            </tr>
          </table>
          ${contact.bookingLink ? `<p style="margin-top: ${verticalSpacing}; font-size: ${textStyling.baseFontSize}px; ${previewMode === 'mobile' ? 'text-align: center;' : ''}"><a href="${contact.bookingLink}" style="color: ${linkColor}; text-decoration: none;">Book a Meeting</a></p>` : ''}
          ${signatureData.socialMedia.length > 0 ? `<p style="margin-top: ${verticalSpacing}; ${previewMode === 'mobile' ? 'text-align: center;' : ''}">${socialIconsHtml}</p>` : ''}
          ${bannerImageHtml}
          ${ctaButtonHtml}
          ${legalHtml}
            </td>
          </tr>
        </table>
      `;
};