"use client";

import { useEffect, useState } from "react";
import { downloadDataURL, generateQRDataURL, printQRCode, sanitizeFilename } from "@/lib/qr";

interface QRDisplayProps {
  value: string;
  title: string;
  onReset: () => void;
}

export default function QRDisplay({ value, title, onReset }: QRDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDataUrl(null);
    setError(null);
    generateQRDataURL(value)
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError("Could not generate QR code for this value.");
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  const handleDownload = () => {
    if (!dataUrl) return;
    downloadDataURL(dataUrl, `${sanitizeFilename(title)}.png`);
  };

  const handlePrint = () => {
    if (!dataUrl) return;
    printQRCode(dataUrl, title, value);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex h-64 w-64 items-center justify-center rounded-2xl border-4 border-white bg-white p-4 shadow-2xl shadow-black/30">
        {error ? (
          <p className="px-4 text-center text-sm text-red-600">{error}</p>
        ) : dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={`QR code for ${title}`} className="h-full w-full" />
        ) : (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        )}
      </div>

      <div className="text-center">
        <p className="text-lg font-semibold text-white">{title}</p>
        <p className="mt-1 max-w-xs break-all font-mono text-xs text-blue-100/60">{value}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={handleDownload}
          disabled={!dataUrl}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-brand-900/30 transition hover:bg-brand-500 disabled:opacity-50"
        >
          Download
        </button>
        <button
          onClick={handlePrint}
          disabled={!dataUrl}
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          Print
        </button>
        <button
          onClick={handleCopy}
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          {copied ? "Copied!" : "Copy value"}
        </button>
        <button
          onClick={onReset}
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
