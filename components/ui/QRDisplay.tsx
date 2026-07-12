"use client";

import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "./Button";
import { Download } from "lucide-react";

interface QRDisplayProps {
  value: string;
  size?: number;
}

export function QRDisplay({ value, size = 128 }: QRDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    const svgElement = qrRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `qrcode-${value}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 border border-border bg-card rounded-xl text-center space-y-3 shadow-sm w-full sm:w-fit">
      <div ref={qrRef} className="p-3 bg-white rounded-lg border border-border">
        <QRCodeSVG value={value} size={size} level="M" />
      </div>
      <div>
        <span className="font-mono font-bold text-xs bg-muted px-2.5 py-1 rounded border border-border block">
          {value}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={downloadQR}
        className="flex items-center gap-1.5 w-full justify-center text-xs"
      >
        <Download className="h-3.5 w-3.5" /> Download SVG
      </Button>
    </div>
  );
}

export default QRDisplay;
