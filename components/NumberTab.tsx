"use client";

import { useRef, useState } from "react";
import QRDisplay from "./QRDisplay";

export default function NumberTab() {
  const [input, setInput] = useState("");
  const [committed, setCommitted] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = () => {
    // Input is used verbatim as typed — a string, never coerced to a number,
    // so leading zeros (e.g. "001234") are preserved exactly.
    if (!input) return;
    setCommitted(input);
  };

  const handleReset = () => {
    setInput("");
    setCommitted(null);
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20 backdrop-blur">
        <label className="mb-2 block text-sm font-medium text-blue-100/80">Enter a number or value</label>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setCommitted(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleGenerate();
          }}
          placeholder="e.g. 001234"
          className="w-full rounded-xl border border-white/15 bg-navy-900 px-4 py-3 text-sm text-white placeholder-blue-100/30 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40"
        />
        <p className="mt-2 text-xs text-blue-100/50">Entered exactly as typed — leading zeros are preserved.</p>

        <button
          onClick={handleGenerate}
          disabled={!input}
          className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/40 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Generate QR Code
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
