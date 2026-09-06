export type LocationMap = Record<string, string>;

export interface LocationRow {
  location: string;
  qrValue: string;
}

export function mapToRows(map: LocationMap): LocationRow[] {
  return Object.entries(map)
    .map(([location, qrValue]) => ({ location, qrValue }))
    .sort((a, b) => a.location.localeCompare(b.location, undefined, { numeric: true, sensitivity: "base" }));
}

export function rowsToMap(rows: LocationRow[]): LocationMap {
  const map: LocationMap = {};
  for (const row of rows) {
    const loc = row.location.trim();
    if (!loc) continue;
    map[loc] = row.qrValue;
  }
  return map;
}

/** Case-insensitive exact lookup. Returns undefined if the location key doesn't exist at all. */
export function findLocation(map: LocationMap, query: string): { key: string; value: string } | undefined {
  const target = query.trim().toLowerCase();
  for (const key of Object.keys(map)) {
    if (key.toLowerCase() === target) {
      return { key, value: map[key] };
    }
  }
  return undefined;
}

/** Fuzzy search: prioritizes prefix matches, then "contains" matches. */
export function searchLocations(map: LocationMap, query: string, limit = 50): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return Object.keys(map).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const starts: string[] = [];
  const contains: string[] = [];
  for (const key of Object.keys(map)) {
    const lower = key.toLowerCase();
    if (lower.startsWith(q)) starts.push(key);
    else if (lower.includes(q)) contains.push(key);
  }
  const sortFn = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });
  return [...starts.sort(sortFn), ...contains.sort(sortFn)].slice(0, limit);
}

// ---------- CSV ----------

export function parseCSV(text: string): LocationRow[] {
  const lines = text.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cells.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  };

  let startIdx = 0;
  const firstCells = parseLine(lines[0]).map((c) => c.toLowerCase());
  const hasHeader =
    firstCells.includes("location") || firstCells.includes("qr_value") || firstCells.includes("qrvalue");
  let locIdx = 0;
  let valIdx = 1;
  if (hasHeader) {
    startIdx = 1;
    const locHeaderIdx = firstCells.findIndex((c) => c === "location" || c === "name");
    const valHeaderIdx = firstCells.findIndex((c) => c === "qr_value" || c === "qrvalue" || c === "value");
    if (locHeaderIdx >= 0) locIdx = locHeaderIdx;
    if (valHeaderIdx >= 0) valIdx = valHeaderIdx;
  }

  const rows: LocationRow[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    const location = (cells[locIdx] ?? "").trim();
    const qrValue = (cells[valIdx] ?? "").trim();
    if (!location) continue;
    rows.push({ location, qrValue });
  }
  return rows;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCSV(rows: LocationRow[]): string {
  const header = "location,qr_value";
  const lines = rows.map((r) => `${csvEscape(r.location)},${csvEscape(r.qrValue)}`);
  return [header, ...lines].join("\n") + "\n";
}

// ---------- JSON ----------

export function parseJSONMapping(text: string): LocationRow[] {
  const data = JSON.parse(text);
  const rows: LocationRow[] = [];

  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === "object") {
        const location = String(item.location ?? item.name ?? "").trim();
        const qrValue = String(item.qr_value ?? item.qrValue ?? item.value ?? "").trim();
        if (location) rows.push({ location, qrValue });
      }
    }
  } else if (data && typeof data === "object") {
    for (const [location, qrValue] of Object.entries(data)) {
      if (location) rows.push({ location, qrValue: String(qrValue ?? "") });
    }
  }
  return rows;
}

export function toJSONMapping(rows: LocationRow[]): string {
  return JSON.stringify(rowsToMap(rows), null, 2);
}
