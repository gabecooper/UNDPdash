export function parseCsv(raw) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    const next = raw[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row.push(value);
      if (row.some((cell) => cell !== "")) {
        rows.push(row);
      }

      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value !== "" || row.length) {
    row.push(value);
    if (row.some((cell) => cell !== "")) {
      rows.push(row);
    }
  }

  const [headers = [], ...dataRows] = rows;
  return dataRows.map((dataRow) =>
    headers.reduce((accumulator, header, index) => {
      accumulator[header] = dataRow[index] ?? "";
      return accumulator;
    }, {})
  );
}

export function toNumber(value) {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toCamelCase(value) {
  const segments = String(value)
    .trim()
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);

  if (!segments.length) return "";

  const normalizeFirstSegment = (segment) => (
    /^[A-Z0-9]+$/.test(segment)
      ? segment.toLowerCase()
      : `${segment[0].toLowerCase()}${segment.slice(1)}`
  );

  const normalizeNextSegment = (segment) => (
    /^[A-Z0-9]+$/.test(segment)
      ? `${segment[0]}${segment.slice(1).toLowerCase()}`
      : `${segment[0].toUpperCase()}${segment.slice(1)}`
  );

  return segments
    .map((segment, index) => (
      index === 0
        ? normalizeFirstSegment(segment)
        : normalizeNextSegment(segment)
    ))
    .join("");
}

export function toLabel(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function isMissingHierarchyValue(value) {
  if (value == null) return true;
  const normalized = String(value).trim();
  return normalized === "" || normalized.toLowerCase() === "none";
}

export function cascadeHierarchyFromLeft(row, columns) {
  let closestLeftValue = "";

  return columns.reduce((nextRow, column) => {
    const rawValue = row[column];
    const normalizedValue = isMissingHierarchyValue(rawValue) ? "" : String(rawValue).trim();

    if (normalizedValue) {
      closestLeftValue = normalizedValue;
    }

    nextRow[column] = normalizedValue || closestLeftValue || "";
    return nextRow;
  }, { ...row });
}
