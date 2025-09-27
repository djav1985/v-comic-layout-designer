import { SignatureData } from '../SignatureDesigner';

// Interface for all pre-calculated variables and HTML snippets passed to individual templates
export interface TemplateVars {
  signatureData: SignatureData;
  previewMode: 'desktop' | 'mobile';
  verticalSpacing: string;
  horizontalSpacing: string;
  headshotPxSize: number;
  headshotBorderRadius: string;
  baseStyles: string;
  linkColor: string;
  socialIconsHtml: string;
  logoUrl: string;
  dynamicHeadshotUrl: string;
  dynamicBannerUrl: string;
  headshotHtml: string;
  bannerImageHtml: string;
  ctaButtonHtml: string;
  dividerHtml: string;
  legalHtml: string;
  mobileColumnTdStyle: string;
  mobileHeadshotWrapperStyle: string;
}

// Type for individual template functions
export type TemplateFunction = (templateVars: TemplateVars) => string;

// Type for the BaseTemplate function's children prop
export type BaseTemplateChildren = (templateVars: TemplateVars) => string;