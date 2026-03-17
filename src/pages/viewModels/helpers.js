import { formatPeso, formatPesoCompact } from "../../data/formatters";
import { YEAR_OPTIONS } from "../../data/yearFields";

export function getComparisonYear(selectedYears) {
  if (selectedYears.length === YEAR_OPTIONS.length) return null;
  const oldestSelectedYear = selectedYears[0];
  const oldestIndex = YEAR_OPTIONS.indexOf(oldestSelectedYear);

  if (oldestIndex <= 0) return null;

  const priorYear = YEAR_OPTIONS[oldestIndex - 1];
  return selectedYears.includes(priorYear) ? null : priorYear;
}

export function getDimensionLabel(dataset, key) {
  return dataset.dimensionFields.find((field) => field.key === key)?.label || key;
}

export function buildDimensionColumns(dataset, keys) {
  return keys.map((key) => ({
    key,
    label: getDimensionLabel(dataset, key),
    minWidth: key.toLowerCase().includes("item") ? 220 : undefined,
    render: (row) => row.dimensions[key],
  }));
}

export function buildYearColumns(selectedYears) {
  return selectedYears.map((year) => ({
    key: year,
    label: year,
    align: "right",
    render: (row) => formatPeso(row.valuesByYear[year] || 0),
  }));
}

export function buildSelectedAverageColumn() {
  return {
    key: "selectedAverage",
    label: "Selected Avg",
    align: "right",
    emphasis: true,
    render: (row) => formatPeso(row.selectedAverage),
  };
}

export function buildSummaryMeta(selectedYears, count, noun = "rows") {
  return `${selectedYears.join(", ")} selected • ${count.toLocaleString("en-US")} ${noun}`;
}

export function buildLargestGroupLabel(label, value) {
  if (!label) return "No data available";
  return `${label} • ${formatPesoCompact(value)}`;
}

export function placeKpiFirst(kpis, title) {
  const index = kpis.findIndex((kpi) => kpi.title === title);
  if (index <= 0) return kpis;

  const next = [...kpis];
  const [match] = next.splice(index, 1);
  next.unshift(match);
  return next;
}
