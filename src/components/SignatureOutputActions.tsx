"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Contact } from "lucide-react";

interface SignatureOutputActionsProps {
  onCopyHtml: () => void;
  onExportPng: () => void;
  onGenerateVCard: () => void;
}

export const SignatureOutputActions: React.FC<SignatureOutputActionsProps> = ({
  onCopyHtml,
  onExportPng,
  onGenerateVCard,
}) => {
  return (
    <div className="mt-6 p-4 border border-border rounded-lg shadow-sm bg-card flex flex-col sm:flex-row items-center justify-around gap-4">
      <Button onClick={onCopyHtml} className="w-full sm:w-auto">
        <Copy className="mr-2 h-4 w-4" /> Copy HTML
      </Button>
      <Button onClick={onExportPng} variant="outline" className="w-full sm:w-auto">
        <Download className="mr-2 h-4 w-4" /> Export PNG
      </Button>
      <Button onClick={onGenerateVCard} variant="secondary" className="w-full sm:w-auto">
        <Contact className="mr-2 h-4 w-4" /> Generate vCard
      </Button>
    </div>
  );
};