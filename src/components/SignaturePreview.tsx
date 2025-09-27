"use client";

import React, { useEffect, useRef, useState } from "react";
import { SignatureData } from "./SignatureDesigner";

interface SignaturePreviewProps {
  signatureData: SignatureData;
  previewMode: "desktop" | "mobile";
}

const generateSignatureHtml = (data: SignatureData): string => {
  const { identity, template } = data;

  // Basic inline CSS for email compatibility
  const baseStyles = `
    font-family: Arial, sans-serif;
    font-size: 14px;
    color: #333333;
    line-height: 1.4;
  `;

  let contentHtml = '';

  switch (template) {
    case "classic-two-column":
      contentHtml = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="${baseStyles}">
          <tr>
            <td valign="top" style="padding-right: 10px; width: 100px;">
              <img src="https://via.placeholder.com/80" alt="Headshot" width="80" height="80" style="display: block; border-radius: 50%;" />
            </td>
            <td valign="top">
              <p style="margin: 0; font-size: 16px; font-weight: bold;">${identity.fullName}</p>
              <p style="margin: 0; font-size: 13px; color: #555555;">${identity.jobTitle} | ${identity.department}</p>
              <p style="margin: 0; font-size: 12px; color: #777777;">${identity.pronouns}</p>
              <p style="margin-top: 10px; font-size: 12px;">
                <a href="#" style="color: #1a73e8; text-decoration: none;">Website</a> |
                <a href="#" style="color: #1a73e8; text-decoration: none;">LinkedIn</a>
              </p>
            </td>
          </tr>
        </table>
      `;
      break;
    case "compact-single-column":
      contentHtml = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="${baseStyles}">
          <tr>
            <td style="text-align: center;">
              <p style="margin: 0; font-size: 16px; font-weight: bold;">${identity.fullName}</p>
              <p style="margin: 0; font-size: 13px; color: #555555;">${identity.jobTitle}</p>
              <p style="margin: 0; font-size: 12px; color: #777777;">${identity.department}</p>
              <p style="margin-top: 10px; font-size: 12px;">
                <a href="#" style="color: #1a73e8; text-decoration: none;">Email</a> |
                <a href="#" style="color: #1a73e8; text-decoration: none;">Phone</a>
              </p>
            </td>
          </tr>
        </table>
      `;
      break;
    // Add more template cases here as they are implemented
    default:
      contentHtml = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="${baseStyles}">
          <tr>
            <td>
              <p style="margin: 0; font-size: 16px; font-weight: bold;">${identity.fullName}</p>
              <p style="margin: 0; font-size: 13px; color: #555555;">${identity.jobTitle}</p>
              <p style="margin: 0; font-size: 12px; color: #777777;">Template: ${template}</p>
              <p style="margin-top: 10px; font-size: 12px;">More details coming soon!</p>
            </td>
          </tr>
        </table>
      `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; }
        p { margin: 0; }
      </style>
    </head>
    <body>
      ${contentHtml}
    </body>
    </html>
  `;
};

export const SignaturePreview: React.FC<SignaturePreviewProps> = ({ signatureData, previewMode }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeContent, setIframeContent] = useState("");

  useEffect(() => {
    setIframeContent(generateSignatureHtml(signatureData));
  }, [signatureData]);

  useEffect(() => {
    if (iframeRef.current && iframeContent) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(iframeContent);
        iframeDoc.close();
      }
    }
  }, [iframeContent]);

  const previewWidth = previewMode === "desktop" ? "100%" : "320px"; // Common mobile width

  return (
    <div className="flex-grow flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-md shadow-inner overflow-hidden">
      <div
        className="bg-white p-4 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg transition-all duration-300 ease-in-out"
        style={{ width: previewWidth, maxWidth: "600px", minHeight: "150px" }}
      >
        <iframe
          ref={iframeRef}
          title="Email Signature Preview"
          className="w-full h-full border-none bg-transparent"
          style={{ minHeight: "100px" }}
        />
      </div>
    </div>
  );
};