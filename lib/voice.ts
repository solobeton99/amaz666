"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cleans a spoken transcript into a location-code shape: maps the spoken
 * word for a hyphen ("tiret" in French, "dash" in English) to a literal "-",
 * strips remaining spaces, and uppercases. Speech APIs don't spell codes
 * like "A3-1A" reliably, so this is a best-effort normalization — the
 * existing fuzzy search still helps when it isn't exact.
 */
export function normalizeSpokenLocation(raw: string): string {
  let s = raw.trim().toLowerCase();
  s = s.replace(/\b(tiret|dash|hyphen)\b/g, "-");
  s = s.replace(/\s+/g, "");
  s = s.replace(/-{2,}/g, "-");
  return s.toUpperCase();
}

export function useSpeechRecognition(lang: string, onResult: (transcript: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!Ctor);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) onResultRef.current(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang]);

  useEffect(() => stop, [stop]);

  return { listening, supported, start, stop };
}
