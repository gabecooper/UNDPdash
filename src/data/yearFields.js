/**
 * Shared year options used throughout the dashboard.
 * @type {string[]}
 */
export const YEAR_OPTIONS = ["2024", "2025", "2026"];

const YEAR_VALUE_PATTERN = /^(\d{4})_(Actual|Program|GAA)(?:_[A-Za-z0-9]+)*$/i;

export function sortYears(years) {
  return [...years].sort((left, right) => Number(left) - Number(right));
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
