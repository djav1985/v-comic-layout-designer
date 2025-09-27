"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Contact, FileText } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

interface SignatureOutputActionsProps {
  generatedHtml: string;
  onCopyHtml: () => void;
  onExportPng: () => void;
  onGenerateVCard: () => void;
}

export const SignatureOutputActions: React.FC<SignatureOutputActionsProps> = ({
  generatedHtml,
  onCopyHtml,
  onExportPng,
  onGenerateVCard,
}) => {
  const handleDownloadHtml = () => {
    if (!generatedHtml) {
      showError("No signature HTML to download.");
      return;
    }
    
    try {
      const blob = new Blob([generatedHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "email-signature.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess("HTML file downloaded!");
    } catch (err) {
      console.error("Failed to download HTML: ", err);
      showError("Failed to download HTML. Please try again.");
    }
  };

  return (
    <div className="mt-6 p-4 border border-border rounded-lg shadow-xl bg-card flex flex-col sm:flex-row items-center justify-around gap-4">
      <Button onClick={onCopyHtml} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 rounded-lg font-semibold py-2.5 px-5 active:scale-95">
        <Copy className="mr-2 h-4 w-4" /> Copy HTML
      </Button>
      <Button onClick={onExportPng} variant="outline" className="w-full sm:w-auto border-input text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200 rounded-lg font-semibold py-2.5 px-5 active:scale-95">
        <Download className="mr-2 h-4 w-4" /> Export PNG
      </Button>
      <Button onClick={handleDownloadHtml} variant="secondary" className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors duration-200 rounded-lg font-semibold py-2.5 px-5 active:scale-95">
        <FileText className="mr-2 h-4 w-4" /> Download HTML
      </Button>
      <Button onClick={onGenerateVCard} variant="ghost" className="w-full sm:w-auto border border-input text-foreground hover:bg-accent transition-colors duration-200 rounded-lg font-semibold py-2.5 px-5 active:scale-95">
        <Contact className="mr-2 h-4 w-4" /> Generate vCard
      </Button>
    </div>
  );
};