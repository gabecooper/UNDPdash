/**
 * Shared year options used throughout the dashboard.
 * @type {string[]}
 */
export const YEAR_OPTIONS = ["2024", "2025", "2026"];

const YEAR_VALUE_PATTERN = /^(\d{4})_(Actual|Program|GAA)(?:_[A-Za-z0-9]+)*$/i;
const YEAR_FIELD_PATTERN = /^(\d{4})_(Actual|Program|GAA)(?:_(.+))?$/i;
const PERCENT_FIELD_PATTERN = /percent|share/i;

export function sortYears(years) {
  return [...new Set(years)]
    .filter((year) => YEAR_OPTIONS.includes(String(year)))
    .sort((left, right) => Number(left) - Number(right));
}

export function isYearValueField(fieldName) {
  return YEAR_VALUE_PATTERN.test(fieldName);
}

export function getYearFromField(fieldName) {
  const match = YEAR_VALUE_PATTERN.exec(fieldName);
  return match ? match[1] : null;
}

export function detectYearValueFields(headers) {
  return headers.reduce((accumulator, header) => {
    const year = getYearFromField(header);
    if (year) {
      accumulator[year] = header;
    }
    return accumulator;
  }, {});
}

function normalizeSeriesKey(rawSeriesKey) {
  if (!rawSeriesKey) return "amount";

  const normalized = rawSeriesKey.trim();
  if (!normalized) return "amount";

  return normalized;
}

export function parseYearFieldParts(fieldName) {
  const match = YEAR_FIELD_PATTERN.exec(fieldName);
  if (!match) return null;

  const [, year, stage, rawSeriesKey] = match;
  const seriesKey = normalizeSeriesKey(rawSeriesKey);

  return {
    fieldName,
    year,
    stage,
    rawSeriesKey,
    seriesKey,
    isPercent: PERCENT_FIELD_PATTERN.test(seriesKey),
    isTotal: /(?:^|_)total$/i.test(seriesKey),
  };
}

export function buildYearFieldCatalog(headers) {
  return headers.reduce((accumulator, header) => {
    const parts = parseYearFieldParts(header);
    if (!parts) return accumulator;

    if (!accumulator[parts.year]) {
      accumulator[parts.year] = [];
    }

    accumulator[parts.year].push(parts);
    return accumulator;
  }, {});
}
