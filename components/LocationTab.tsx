"use client";

import { useMemo, useRef, useState } from "react";
import { LocationMap, findLocation, searchLocations } from "@/lib/locations";
import QRDisplay from "./QRDisplay";

interface LocationTabProps {
  locations: LocationMap;
}

export default function LocationTab({ locations }: LocationTabProps) {
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
      setMessage("Location not found.");
      return;
    }
    if (!found.value) {
      setSelected(null);
      setMessage("No QR code has been assigned to this location yet.");
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

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20 backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-blue-100/80">Enter or select a location</label>
          <span className="rounded-full bg-brand-500/15 px-2.5 py-0.5 text-xs font-medium text-brand-300">
            {Object.keys(locations).length.toLocaleString()} locations
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
            placeholder="e.g. A3-1A"
            className="w-full rounded-xl border border-white/15 bg-navy-900 px-4 py-3 pr-11 text-sm text-white placeholder-blue-100/30 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40"
          />
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

        <button
          onClick={handleGenerate}
          className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/40 transition hover:bg-brand-500"
        >
          Generate QR Code
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
