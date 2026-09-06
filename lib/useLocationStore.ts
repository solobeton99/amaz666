"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LocationMap, LocationRow } from "./locations";

const STORAGE_KEY = "qr-manager:locations:v2";
const SEED_VERSION_KEY = "qr-manager:seed-version:v2";
// Bump this whenever the bundled /locations.seed.json changes, so returning
// visitors with an older cached copy in localStorage pick up the new data.
const SEED_VERSION = "2026-09-06-full-extraction";

async function fetchSeed(): Promise<LocationMap> {
  const manifestRes = await fetch("/data/manifest.json", { cache: "force-cache" });
  if (!manifestRes.ok) throw new Error("Failed to load seed manifest");
  const manifest = (await manifestRes.json()) as { shards: string[] };

  const shardMaps = await Promise.all(
    manifest.shards.map(async (name) => {
      const res = await fetch(`/data/${name}`, { cache: "force-cache" });
      if (!res.ok) throw new Error(`Failed to load shard ${name}`);
      return (await res.json()) as LocationMap;
    })
  );

  const merged: LocationMap = {};
  for (const shard of shardMaps) Object.assign(merged, shard);
  return merged;
}

function loadFromStorage(): LocationMap | null {
  try {
    const storedVersion = window.localStorage.getItem(SEED_VERSION_KEY);
    if (storedVersion !== SEED_VERSION) return null; // stale/older seed — force refetch
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LocationMap;
  } catch {
    // fall through
  }
  return null;
}

function saveToStorage(map: LocationMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  } catch {
    // storage unavailable (private mode, quota) — edits stay in-memory for this session
  }
}

export function useLocationStore() {
  const [locations, setLocations] = useState<LocationMap>({});
  const [ready, setReady] = useState(false);
  const seedRef = useRef<LocationMap>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = loadFromStorage();
      if (cached) {
        setLocations(cached);
        setReady(true);
      }
      try {
        const seed = await fetchSeed();
        if (cancelled) return;
        seedRef.current = seed;
        if (!cached) {
          setLocations(seed);
          saveToStorage(seed);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: LocationMap) => {
    setLocations(next);
    saveToStorage(next);
  }, []);

  const upsert = useCallback(
    (location: string, qrValue: string) => {
      const loc = location.trim();
      if (!loc) return;
      persist({ ...locations, [loc]: qrValue.trim() });
    },
    [locations, persist]
  );

  const remove = useCallback(
    (location: string) => {
      const next = { ...locations };
      delete next[location];
      persist(next);
    },
    [locations, persist]
  );

  const bulkImport = useCallback(
    (rows: LocationRow[], mode: "merge" | "replace") => {
      const base = mode === "replace" ? {} : { ...locations };
      for (const row of rows) {
        if (!row.location) continue;
        base[row.location] = row.qrValue;
      }
      persist(base);
      return rows.length;
    },
    [locations, persist]
  );

  const resetToSeed = useCallback(() => {
    persist({ ...seedRef.current });
  }, [persist]);

  return { locations, ready, upsert, remove, bulkImport, resetToSeed };
}
