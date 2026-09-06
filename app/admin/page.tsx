"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocationStore } from "@/lib/useLocationStore";
import { mapToRows, parseCSV, parseJSONMapping, toCSV, toJSONMapping } from "@/lib/locations";
import { downloadDataURL } from "@/lib/qr";

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  downloadDataURL(url, filename);
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const { locations, ready, upsert, remove, bulkImport, resetToSeed } = useLocationStore();
  const [search, setSearch] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const PAGE_SIZE = 50;

  const rows = useMemo(() => {
    const all = mapToRows(locations);
    if (!search.trim()) return all;
    const q = search.trim().toLowerCase();
    return all.filter((r) => r.location.toLowerCase().includes(q) || r.qrValue.toLowerCase().includes(q));
  }, [locations, search]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = useMemo(
    () => rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [rows, currentPage]
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleAdd = () => {
    const loc = newLocation.trim();
    if (!loc || !newValue.trim()) {
      setStatus("Both location and QR value are required.");
      return;
    }
    if (locations[loc] !== undefined) {
      setStatus(`"${loc}" already exists. Edit it below instead.`);
      return;
    }
    upsert(loc, newValue.trim());
    setNewLocation("");
    setNewValue("");
    setStatus(`Added "${loc}".`);
  };

  const startEdit = (key: string) => {
    setEditingKey(key);
    setEditValue(locations[key]);
  };

  const saveEdit = (key: string) => {
    upsert(key, editValue.trim());
    setEditingKey(null);
    setStatus(`Updated "${key}".`);
  };

  const handleDelete = (key: string) => {
    if (!confirm(`Delete location "${key}"? This cannot be undone.`)) return;
    remove(key);
    setStatus(`Deleted "${key}".`);
  };

  const handleImportFile = async (file: File, mode: "merge" | "replace") => {
    const text = await file.text();
    try {
      const rows = file.name.toLowerCase().endsWith(".json") ? parseJSONMapping(text) : parseCSV(text);
      if (rows.length === 0) {
        setStatus("No valid rows found in the file.");
        return;
      }
      const count = bulkImport(rows, mode);
      setStatus(`Imported ${count} location${count === 1 ? "" : "s"} (${mode}).`);
    } catch (e) {
      setStatus("Could not parse the file. Expected CSV (location,qr_value) or JSON.");
    }
  };

  const handleExportCSV = () => downloadText("locations.csv", toCSV(mapToRows(locations)), "text/csv");
  const handleExportJSON = () => downloadText("locations.json", toJSONMapping(mapToRows(locations)), "application/json");

  const inputClass =
    "rounded-lg border border-white/15 bg-navy-900 px-3 py-2 text-sm text-white placeholder-blue-100/30 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40";
  const secondaryBtn =
    "rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10";

  return (
    <main className="min-h-screen bg-navy-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Location Admin</h1>
            <p className="mt-1 text-sm text-blue-100/60">
              Add, edit, delete, import and export the location → QR-value mapping.
            </p>
          </div>
          <Link href="/" className="text-sm font-medium text-brand-400 hover:text-brand-300">
            ← Back to generator
          </Link>
        </header>

        {status && (
          <p className="mb-4 rounded-xl border border-brand-400/30 bg-brand-500/10 px-4 py-2 text-sm text-brand-200">
            {status}
          </p>
        )}

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20 backdrop-blur">
          <h2 className="mb-3 text-sm font-semibold text-blue-100/80">Add location</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Location (e.g. A3-5A)"
              className={`flex-1 ${inputClass}`}
            />
            <input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="QR value (e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
              className={`flex-1 font-mono ${inputClass}`}
            />
            <button
              onClick={handleAdd}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-900/30 transition hover:bg-brand-500"
            >
              Save
            </button>
          </div>
        </section>

        <section className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20 backdrop-blur">
          <h2 className="w-full text-sm font-semibold text-blue-100/80">Import / Export</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file, "merge");
              e.target.value = "";
            }}
          />
          <button onClick={() => fileInputRef.current?.click()} className={secondaryBtn}>
            Import CSV/JSON (merge)
          </button>
          <button
            onClick={() => {
              if (!confirm("This replaces the entire current mapping with the imported file. Continue?")) return;
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".csv,.json";
              input.onchange = () => {
                const file = input.files?.[0];
                if (file) handleImportFile(file, "replace");
              };
              input.click();
            }}
            className={secondaryBtn}
          >
            Import CSV/JSON (replace all)
          </button>
          <button onClick={handleExportCSV} className={secondaryBtn}>
            Export CSV
          </button>
          <button onClick={handleExportJSON} className={secondaryBtn}>
            Export JSON
          </button>
          <button
            onClick={() => {
              if (!confirm("Reset to the original seed dataset? Your edits will be lost.")) return;
              resetToSeed();
              setStatus("Reset to seed dataset.");
            }}
            className="ml-auto rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
          >
            Reset to seed
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20 backdrop-blur">
          <div className="border-b border-white/10 p-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search locations…"
              className={`w-full ${inputClass}`}
            />
          </div>
          <div className="max-h-[28rem] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-navy-900 text-xs uppercase tracking-wide text-blue-100/50">
                <tr>
                  <th className="px-4 py-2">Location</th>
                  <th className="px-4 py-2">QR Value</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {!ready ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-blue-100/40">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-blue-100/40">
                      No locations match your search.
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((r) => (
                    <tr key={r.location} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-2 font-medium text-white">{r.location}</td>
                      <td className="px-4 py-2 font-mono text-xs text-blue-100/60">
                        {editingKey === r.location ? (
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveEdit(r.location)}
                            className="w-full rounded border border-white/15 bg-navy-900 px-2 py-1 font-mono text-white outline-none focus:border-brand-400"
                          />
                        ) : r.qrValue ? (
                          r.qrValue
                        ) : (
                          <span className="italic text-amber-400">unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {editingKey === r.location ? (
                          <>
                            <button onClick={() => saveEdit(r.location)} className="mr-3 text-brand-400 hover:text-brand-300">
                              Save
                            </button>
                            <button onClick={() => setEditingKey(null)} className="text-blue-100/50 hover:text-white">
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(r.location)} className="mr-3 text-brand-400 hover:text-brand-300">
                              Edit
                            </button>
                            <button onClick={() => handleDelete(r.location)} className="text-red-400 hover:text-red-300">
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs text-blue-100/40">
            <span>
              {rows.length.toLocaleString()} of {Object.keys(locations).length.toLocaleString()} location
              {Object.keys(locations).length === 1 ? "" : "s"}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="rounded-md border border-white/15 px-2.5 py-1 font-medium text-blue-100/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ← Prev
                </button>
                <span className="text-blue-100/60">
                  Page {currentPage.toLocaleString()} of {totalPages.toLocaleString()}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="rounded-md border border-white/15 px-2.5 py-1 font-medium text-blue-100/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
