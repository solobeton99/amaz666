"use client";

import { useMemo, useRef, useState } from "react";
import { LocationMap, findLocation, searchLocations } from "@/lib/locations";
import QRDisplay from "./QRDisplay";
import { useLanguage } from "@/lib/language";
import { translations } from "@/lib/i18n";
import { normalizeSpokenLocation, useSpeechRecognition } from "@/lib/voice";

interface LocationTabProps {
  locations: LocationMap;
}

export default function LocationTab({ locations }: LocationTabProps) {
  const { lang } = useLanguage();
  const t = translations[lang];
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<{ key: string; value: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => searchLocations(locations, query, 8), [locations, query]);

  const selectLocation = (key: string) => {
    const found = findLocation(locations, key);
    setShowDropdown(false);
    setQuery(key);
    if (!found) {
      setSelected(null);
      setMessage(t.errorNotFound);
      return;
    }
    if (!found.value) {
      setSelected(null);
      setMessage(t.errorNoQr);
      return;
    }
    setMessage(null);
    setSelected(found);
  };

  const handleGenerate = () => {
    if (!query.trim()) return;
    selectLocation(query.trim());
  };

  const handleReset = () => {
    setQuery("");
    setSelected(null);
    setMessage(null);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const { listening, supported, start, stop } = useSpeechRecognition(
    lang === "fr" ? "fr-FR" : "en-US",
    (transcript) => {
      const cleaned = normalizeSpokenLocation(transcript);
      if (!cleaned) return;
      setShowDropdown(true);
      selectLocation(cleaned);
    }
  );

  const toggleListening = () => {
    setMessage(null);
    if (listening) stop();
    else start();
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20 backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-blue-100/80">{t.locationLabel}</label>
          <span className="rounded-full bg-brand-500/15 px-2.5 py-0.5 text-xs font-medium text-brand-300">
            {t.locationsCount(Object.keys(locations).length.toLocaleString())}
          </span>
        </div>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
              setMessage(null);
              setSelected(null);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleGenerate();
              if (e.key === "Escape") setShowDropdown(false);
            }}
            placeholder={t.locationPlaceholder}
            className="w-full rounded-xl border border-white/15 bg-navy-900 px-4 py-3 pr-20 text-sm text-white placeholder-blue-100/30 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40"
          />

          {supported && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleListening}
              title={listening ? t.micTitleStop : t.micTitleStart}
              aria-label={listening ? t.micTitleStop : t.micTitleStart}
              aria-pressed={listening}
              className={`absolute right-9 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition ${
                listening ? "bg-red-500/20 text-red-400" : "text-blue-100/40 hover:bg-white/10 hover:text-white"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0M12 18v3" />
              </svg>
              {listening && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-red-500" />}
            </button>
          )}

          <svg
            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-100/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {showDropdown && matches.length > 0 && (
            <ul className="absolute z-10 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-white/10 bg-navy-800 py-1 shadow-2xl shadow-black/40">
              {matches.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectLocation(key)}
                    className="block w-full px-4 py-2.5 text-left text-sm text-blue-50 transition hover:bg-brand-600/30"
                  >
                    {key}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {listening && <p className="mt-2 text-xs font-medium text-red-300">{t.micListening}</p>}

        <button
          onClick={handleGenerate}
          className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/40 transition hover:bg-brand-500"
        >
          {t.generate}
        </button>
      </div>

      {message && (
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-center text-sm font-medium text-amber-300">
          {message}
        </p>
      )}

      {selected && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20 backdrop-blur">
          <QRDisplay value={selected.value} title={selected.key} onReset={handleReset} />
        </div>
      )}
    </div>
  );
}
