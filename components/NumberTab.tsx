"use client";

import { useRef, useState } from "react";
import QRDisplay from "./QRDisplay";
import { useLanguage } from "@/lib/language";
import { translations } from "@/lib/i18n";
import { decodeQrFromFile } from "@/lib/qrDecode";

export default function NumberTab() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const [input, setInput] = useState("");
  const [committed, setCommitted] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = () => {
    // Input is used verbatim as typed — a string, never coerced to a number,
    // so leading zeros (e.g. "001234") are preserved exactly.
    if (!input) return;
    setCommitted(input);
  };

  const handleReset = () => {
    setInput("");
    setCommitted(null);
    setScanError(null);
    inputRef.current?.focus();
  };

  const handleImageFile = async (file: File | undefined) => {
    if (!file) return;
    setScanError(null);
    setScanning(true);
    try {
      const decoded = await decodeQrFromFile(file);
      if (!decoded) {
        setScanError(t.errorNoQrInImage);
        return;
      }
      setInput(decoded);
      setCommitted(decoded);
    } catch {
      setScanError(t.errorNoQrInImage);
    } finally {
      setScanning(false);
    }
  };

  const secondaryBtn =
    "flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20 backdrop-blur">
        <label className="mb-2 block text-sm font-medium text-blue-100/80">{t.numberLabel}</label>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setCommitted(null);
            setScanError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleGenerate();
          }}
          placeholder={t.numberPlaceholder}
          className="w-full rounded-xl border border-white/15 bg-navy-900 px-4 py-3 text-sm text-white placeholder-blue-100/30 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40"
        />
        <p className="mt-2 text-xs text-blue-100/50">{t.numberHint}</p>

        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleImageFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            handleImageFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            disabled={scanning}
            className={secondaryBtn}
          >
            🖼️ {t.uploadImage}
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={scanning}
            className={secondaryBtn}
          >
            📷 {t.takePhoto}
          </button>
        </div>

        {scanning && <p className="mt-2 text-xs font-medium text-brand-300">{t.scanning}</p>}
        {scanError && <p className="mt-2 text-xs font-medium text-red-300">{scanError}</p>}

        <button
          onClick={handleGenerate}
          disabled={!input}
          className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/40 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t.generate}
        </button>
      </div>

      {committed && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20 backdrop-blur">
          <QRDisplay value={committed} title={committed} onReset={handleReset} />
        </div>
      )}
    </div>
  );
}
