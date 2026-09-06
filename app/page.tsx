"use client";

import { useState } from "react";
import Link from "next/link";
import LocationTab from "@/components/LocationTab";
import NumberTab from "@/components/NumberTab";
import { useLocationStore } from "@/lib/useLocationStore";
import { useLanguage } from "@/lib/language";
import { translations } from "@/lib/i18n";

type Tab = "location" | "number";

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("location");
  const { locations, ready } = useLocationStore();
  const { lang, setLang } = useLanguage();
  const t = translations[lang];

  return (
    <main className="relative min-h-screen overflow-hidden bg-navy-950 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60rem 30rem at 50% -10%, rgba(59,111,224,0.35), transparent 60%), radial-gradient(40rem 20rem at 100% 10%, rgba(91,141,239,0.15), transparent 60%)",
        }}
      />

      <div className="absolute right-4 top-4 z-10 flex overflow-hidden rounded-full border border-white/15 bg-navy-900/60 text-xs font-semibold backdrop-blur">
        <button
          type="button"
          onClick={() => setLang("fr")}
          aria-pressed={lang === "fr"}
          className={`px-3 py-1.5 transition ${
            lang === "fr" ? "bg-brand-600 text-white" : "text-blue-100/60 hover:text-white"
          }`}
        >
          FR
        </button>
        <button
          type="button"
          onClick={() => setLang("en")}
          aria-pressed={lang === "en"}
          className={`px-3 py-1.5 transition ${
            lang === "en" ? "bg-brand-600 text-white" : "text-blue-100/60 hover:text-white"
          }`}
        >
          EN
        </button>
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-14">
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl shadow-lg shadow-brand-900/40">
            📷
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">{t.appTitle}</h1>
          <p className="mt-2 text-blue-100/70">{t.appSubtitle}</p>
          <Link
            href="/admin"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-400 transition hover:text-brand-300"
          >
            {t.adminLink} <span aria-hidden>→</span>
          </Link>
        </header>

        <div className="mx-auto mb-8 flex max-w-md gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur">
          <button
            onClick={() => setTab("location")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === "location"
                ? "bg-brand-600 text-white shadow-lg shadow-brand-900/40"
                : "text-blue-100/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            📍 {t.tabLocation}
          </button>
          <button
            onClick={() => setTab("number")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === "number"
                ? "bg-brand-600 text-white shadow-lg shadow-brand-900/40"
                : "text-blue-100/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            🔢 {t.tabNumber}
          </button>
        </div>

        {!ready ? (
          <p className="text-center text-sm text-blue-100/50">{t.loading}</p>
        ) : tab === "location" ? (
          <LocationTab locations={locations} />
        ) : (
          <NumberTab />
        )}
      </div>
    </main>
  );
}
