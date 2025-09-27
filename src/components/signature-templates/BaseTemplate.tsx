import { SignatureData } from '../SignatureDesigner';
import { getSocialIconSvg } from '@/utils/signatureHtmlUtils';
import { TemplateVars, BaseTemplateChildren } from './templateTypes';

export const BaseTemplate = (props: { signatureData: SignatureData; previewMode: 'desktop' | 'mobile'; children: BaseTemplateChildren }) => {
  const { signatureData, previewMode, children } = props;
  const { identity, company, contact, socialMedia, media, legal, cta, textStyling, divider, spacing } = signatureData;

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

  // Mobile-specific styles for column stacking
  const mobileColumnTdStyle = `width: 100%; display: block; padding-right: 0; text-align: center;`;
  const mobileHeadshotWrapperStyle = `margin: 0 auto ${verticalSpacing} auto;`; // Center headshot on mobile

  const templateVars: TemplateVars = {
    signatureData,
    previewMode,
    verticalSpacing,
    horizontalSpacing,
    headshotPxSize,
    headshotBorderRadius,
    baseStyles,
    linkColor,
    socialIconsHtml,
    logoUrl,
    dynamicHeadshotUrl,
    dynamicBannerUrl,
    headshotHtml,
    bannerImageHtml,
    ctaButtonHtml,
    dividerHtml,
    legalHtml,
    mobileColumnTdStyle,
    mobileHeadshotWrapperStyle,
  };

  return (
    `<!DOCTYPE html>
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
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: ${previewMode === 'mobile' ? '320px' : '600px'}; margin: 0 auto;">
        <tr>
          <td style="padding: 20px 0;">
            ${children(templateVars)}
          </td>
        </tr>
      </table>
      <!--[if (gte mso 9)|(IE)]>
      </td>
      </tr>
      </table>
      <![endif]-->
    </body>
    </html>`
  );
};