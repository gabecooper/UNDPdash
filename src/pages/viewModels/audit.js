import { collectPageNumbers } from "../../data/selectors";

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

export function formatPagesLabel(pages) {
  if (!pages?.length) return "Page unavailable";
  return pages.length === 1 ? `Page ${pages[0]}` : `Pages ${pages.join(", ")}`;
}

export function getPreferredHeadersForYears(dataset, years) {
  const preferredValueFields = dataset.audit?.preferredValueFields || {};
  return uniqueValues(years.map((year) => preferredValueFields[year]));
}

export function getBreakdownHeadersForYears(dataset, years) {
  return uniqueValues(
    years.flatMap((year) => (dataset.yearBreakdownFields?.[year] || []).map((field) => field.source))
  );
}

export function buildAuditInfo({ page, rows = [], headers = [], note = "" }) {
  return {
    sourceFile: page?.csvFile || "CSV unavailable",
    pages: collectPageNumbers(rows),
    headers: uniqueValues(headers),
    note,
  };
}

export function buildRowAuditInfo({ page, row, headers = [] }) {
  return {
    sourceFile: page?.csvFile || "CSV unavailable",
    pages: row.meta?.pageNo ? [String(row.meta.pageNo)] : [],
    headers: uniqueValues(headers),
    note: row.meta?.notes || "",
  };
}

export function buildDatasetAuditSummary({ dataset, page }) {
  const headers = dataset.audit?.headers || [];

  return {
    sourceFile: page?.csvFile || "CSV unavailable",
    totalHeaders: headers.length,
    headers,
    warnings: dataset.audit?.warnings || [],
    preferredValueFields: dataset.audit?.preferredValueFields || {},
    yearBreakdownFields: dataset.yearBreakdownFields || {},
  };
}

export function buildRowDetailSections({ dataset, row }) {
  const dimensionItems = (dataset.dimensionFields || []).map((field) => ({
    label: field.label,
    raw: field.source || field.key,
    value: row.dimensions?.[field.key] || "Unspecified",
    formatAsMoney: false,
  }));

  const yearSections = (dataset.years || []).map((year) => ({
    year,
      items: (dataset.yearBreakdownFields?.[year] || []).map((field) => ({
        label: field.label,
        raw: field.source,
        value: row.meta?.source?.[field.source] ?? "",
        isPercent: field.isPercent,
        formatAsMoney: !field.isPercent,
      })),
  }));

  const metaItems = [
    { label: "Page No", raw: "Page_No", value: row.meta?.pageNo || "", formatAsMoney: false },
    { label: "Ref", raw: "Ref", value: row.meta?.ref || "", formatAsMoney: false },
    { label: "Notes", raw: "Notes", value: row.meta?.notes || "", formatAsMoney: false },
  ].filter((item) => item.value !== "");

  return {
    dimensionItems,
    yearSections,
    metaItems,
  };
}
